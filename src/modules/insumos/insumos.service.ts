import { Injectable } from "@nestjs/common";
import { Insumo, MovimentoEstoque, TipoMovimentoEstoque } from "@prisma/client";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../common/utils/service-response.util";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateInsumoDto } from "./dto/create-insumo.dto";
import { AjusteInsumoDto, EntradaInsumoDto } from "./dto/movimento.dto";
import { UpdateInsumoDto } from "./dto/update-insumo.dto";
import { InsumosRepository } from "./insumos.repository";

@Injectable()
export class InsumosService {
	constructor(
		private readonly repo: InsumosRepository,
		private readonly prisma: PrismaService,
	) {}

	async create(dto: CreateInsumoDto): Promise<IServiceResponse<Insumo>> {
		const exists = await this.repo.findByCodigo(dto.codigo);
		if (exists) return SR.conflict<Insumo>(undefined, "Código de insumo já cadastrado");

		const created = await this.repo.create({
			codigo: dto.codigo,
			nome: dto.nome,
			descricao: dto.descricao,
			precoUnitario: dto.precoUnitario,
			estoqueMinimo: dto.estoqueMinimo ?? 0,
			quantidadeEstoque: dto.quantidadeEstoque ?? 0,
		});

		return SR.created(created, "Insumo cadastrado");
	}

	async findAll(): Promise<IServiceResponse<Insumo[]>> {
		return SR.ok(await this.repo.findAll());
	}

	async findById(id: string): Promise<IServiceResponse<Insumo>> {
		const insumo = await this.repo.findById(id);
		if (!insumo) return SR.notFound<Insumo>(undefined, "Insumo não encontrado");

		return SR.ok(insumo);
	}

	async update(id: string, dto: UpdateInsumoDto): Promise<IServiceResponse<Insumo>> {
		const insumo = await this.repo.findById(id);
		if (!insumo) return SR.notFound<Insumo>(undefined, "Insumo não encontrado");

		const updated = await this.repo.update(id, dto);
		return SR.ok(updated, "Insumo atualizado");
	}

	async remove(id: string): Promise<IServiceResponse<Insumo>> {
		const insumo = await this.repo.findById(id);
		if (!insumo) return SR.notFound<Insumo>(undefined, "Insumo não encontrado");

		const updated = await this.repo.softDelete(id);
		return SR.ok(updated, "Insumo inativado");
	}

	async entrada(id: string, dto: EntradaInsumoDto, usuarioId: string): Promise<IServiceResponse<Insumo>> {
		const insumo = await this.repo.findById(id);
		if (!insumo) return SR.notFound<Insumo>(undefined, "Insumo não encontrado");

		const anterior = insumo.quantidadeEstoque;
		const posterior = anterior + dto.quantidade;

		const updated = await this.prisma.$transaction(async (tx) => {
			const u = await tx.insumo.update({
				where: { id },
				data: { quantidadeEstoque: posterior },
			});
			await tx.movimentoEstoque.create({
				data: {
					insumoId: id,
					tipo: TipoMovimentoEstoque.ENTRADA,
					quantidade: dto.quantidade,
					quantidadeAnterior: anterior,
					quantidadePosterior: posterior,
					motivo: dto.motivo,
					usuarioId,
				},
			});
			return u;
		});

		return SR.ok(updated, "Entrada registrada");
	}

	async ajuste(id: string, dto: AjusteInsumoDto, usuarioId: string): Promise<IServiceResponse<Insumo>> {
		const insumo = await this.repo.findById(id);
		if (!insumo) return SR.notFound<Insumo>(undefined, "Insumo não encontrado");

		if (dto.novaQuantidade < 0) return SR.badRequest<Insumo>(undefined, "Quantidade não pode ser negativa");

		const anterior = insumo.quantidadeEstoque;
		const posterior = dto.novaQuantidade;
		const delta = posterior - anterior;

		const updated = await this.prisma.$transaction(async (tx) => {
			const u = await tx.insumo.update({
				where: { id },
				data: { quantidadeEstoque: posterior },
			});
			await tx.movimentoEstoque.create({
				data: {
					insumoId: id,
					tipo: TipoMovimentoEstoque.AJUSTE,
					quantidade: Math.abs(delta),
					quantidadeAnterior: anterior,
					quantidadePosterior: posterior,
					motivo: dto.motivo,
					usuarioId,
				},
			});
			return u;
		});

		return SR.ok(updated, "Ajuste realizado");
	}

	async listarMovimentos(id: string): Promise<IServiceResponse<MovimentoEstoque[]>> {
		const insumo = await this.repo.findById(id);
		if (!insumo) return SR.notFound<MovimentoEstoque[]>(undefined, "Insumo não encontrado");

		return SR.ok(await this.repo.listarMovimentos(id));
	}

	async alertasEstoqueBaixo(): Promise<IServiceResponse<Insumo[]>> {
		return SR.ok(await this.repo.findEstoqueBaixo());
	}
}
