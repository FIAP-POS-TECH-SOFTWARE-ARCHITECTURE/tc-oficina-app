import { Injectable } from "@nestjs/common";
import { Prisma, RegistroCompraStatus, TipoMovimentoEstoque } from "@prisma/client";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../common/utils/service-response.util";
import { PrismaService } from "../../prisma/prisma.service";
import { CancelarRegistroCompraDto } from "./dto/cancelar-registro-compra.dto";
import { CreateRegistroCompraDto } from "./dto/create-registro-compra.dto";
import { ReceberCompraDto } from "./dto/receber-compra.dto";
import { RegistrarRespostaFornecedorDto } from "./dto/registrar-resposta-fornecedor.dto";
import { FornecedorStubService } from "./fornecedor-stub.service";
import { InsumosRepository } from "./insumos.repository";
import { RegistrosCompraRepository } from "./registros-compra.repository";

@Injectable()
export class RegistrosCompraService {
	constructor(
		private readonly repo: RegistrosCompraRepository,
		private readonly insumos: InsumosRepository,
		private readonly fornecedorStub: FornecedorStubService,
		private readonly prisma: PrismaService,
	) {}

	async create(dto: CreateRegistroCompraDto, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const insumo = await this.insumos.findById(dto.insumoId);
		if (!insumo) return SR.notFound(undefined, "Insumo não encontrado");

		if (dto.ordemServicoId) {
			const os = await this.prisma.ordemServico.findUnique({ where: { id: dto.ordemServicoId } });
			if (!os) return SR.notFound(undefined, "OS não encontrada para vincular o registro de compra");
		}

		const created = await this.repo.create({
			quantidadeSolicitada: dto.quantidadeSolicitada,
			insumo: { connect: { id: dto.insumoId } },
			solicitadoPor: { connect: { id: usuarioId } },
			ordemServico: dto.ordemServicoId ? { connect: { id: dto.ordemServicoId } } : undefined,
		});

		const detalhe = await this.repo.findByIdFull(created.id);
		return SR.created(detalhe, "Registro de compra criado");
	}

	async list(): Promise<IServiceResponse<unknown>> {
		return SR.ok(await this.repo.findAll());
	}

	async findById(id: string): Promise<IServiceResponse<unknown>> {
		const registro = await this.repo.findByIdFull(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		return SR.ok(registro);
	}

	async enviarFornecedor(id: string): Promise<IServiceResponse<unknown>> {
		const registro = await this.repo.findByIdFull(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status !== RegistroCompraStatus.CRIADO)
			return SR.unprocessableEntity(undefined, `Não é possível enviar para fornecedor no status ${registro.status}`);

		const resposta = this.fornecedorStub.enviarCompra({
			registroCompraId: registro.id,
			insumoCodigo: registro.insumo.codigo,
			quantidadeSolicitada: registro.quantidadeSolicitada,
		});

		await this.repo.update(id, {
			status: resposta.aprovado ? RegistroCompraStatus.APROVADO_FORNECEDOR : RegistroCompraStatus.RECUSADO_FORNECEDOR,
			fornecedorRespostaCodigo: resposta.codigo,
			fornecedorMensagem: resposta.mensagem,
			fornecedorPayload: resposta.payload as Prisma.InputJsonValue,
			aprovadoEm: resposta.aprovado ? new Date() : null,
			recusadoEm: resposta.aprovado ? null : new Date(),
			motivoRecusa: resposta.aprovado ? null : resposta.mensagem,
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Resposta do fornecedor registrada (stub)");
	}

	async registrarRespostaFornecedor(id: string, dto: RegistrarRespostaFornecedorDto): Promise<IServiceResponse<unknown>> {
		const registro = await this.repo.findById(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status !== RegistroCompraStatus.CRIADO)
			return SR.unprocessableEntity(undefined, `Não é possível registrar resposta no status ${registro.status}`);

		if (!dto.aprovado && !dto.motivoRecusa && !dto.mensagem) return SR.badRequest(undefined, "Informe o motivo da recusa");

		await this.repo.update(id, {
			status: dto.aprovado ? RegistroCompraStatus.APROVADO_FORNECEDOR : RegistroCompraStatus.RECUSADO_FORNECEDOR,
			fornecedorRespostaCodigo: dto.codigo,
			fornecedorMensagem: dto.mensagem,
			fornecedorPayload: dto.payload as Prisma.InputJsonValue | undefined,
			aprovadoEm: dto.aprovado ? new Date() : null,
			recusadoEm: dto.aprovado ? null : new Date(),
			motivoRecusa: dto.aprovado ? null : (dto.motivoRecusa ?? dto.mensagem),
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Resposta do fornecedor registrada");
	}

	async cancelar(id: string, dto: CancelarRegistroCompraDto): Promise<IServiceResponse<unknown>> {
		const registro = await this.repo.findById(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status === RegistroCompraStatus.RECEBIDO)
			return SR.unprocessableEntity(undefined, "Não é possível cancelar um registro já recebido");

		if (registro.status === RegistroCompraStatus.CANCELADO)
			return SR.unprocessableEntity(undefined, "Registro de compra já está cancelado");

		await this.repo.update(id, {
			status: RegistroCompraStatus.CANCELADO,
			motivoCancelamento: dto.motivo,
			canceladoEm: new Date(),
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Pedido de compra cancelado");
	}

	async receber(id: string, dto: ReceberCompraDto, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const registro = await this.repo.findById(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status !== RegistroCompraStatus.APROVADO_FORNECEDOR)
			return SR.unprocessableEntity(undefined, `Só é possível receber compra aprovada. Status atual: ${registro.status}`);

		await this.prisma.$transaction(async (tx) => {
			const insumo = await tx.insumo.findUnique({ where: { id: registro.insumoId } });
			if (!insumo) throw new Error(`Insumo ${registro.insumoId} não encontrado`);
			
			const anterior = insumo.quantidadeEstoque;
			const posterior = anterior + registro.quantidadeSolicitada;

			await tx.insumo.update({
				where: { id: insumo.id },
				data: { quantidadeEstoque: posterior },
			});

			await tx.movimentoEstoque.create({
				data: {
					insumoId: insumo.id,
					tipo: TipoMovimentoEstoque.ENTRADA,
					quantidade: registro.quantidadeSolicitada,
					quantidadeAnterior: anterior,
					quantidadePosterior: posterior,
					motivo: `Entrada por recebimento da compra ${registro.id} (NF ${dto.notaFiscalNumero})`,
					usuarioId,
				},
			});
			
			await tx.registroCompra.update({
				where: { id: registro.id },
				data: {
					status: RegistroCompraStatus.RECEBIDO,
					recebidoEm: new Date(),
					recebidoPorId: usuarioId,
					notaFiscalNumero: dto.notaFiscalNumero,
					notaFiscalChave: dto.notaFiscalChave,
					notaFiscalArquivoNome: dto.arquivoNome,
					notaFiscalArquivoTipo: dto.arquivoTipo,
					notaFiscalArquivoTamanho: dto.arquivoTamanho,
					notaFiscalArquivoUrl: dto.arquivoUrl,
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Compra recebida e entrada de estoque registrada");
	}
}
