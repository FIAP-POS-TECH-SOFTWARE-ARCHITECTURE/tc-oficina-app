import { Injectable, Logger } from "@nestjs/common";
import { OsItemServicoStatus, OsStatus, Prisma, TipoMovimentoEstoque } from "@prisma/client";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../common/validators/cpf-cnpj.validator";
import { PrismaService } from "../../prisma/prisma.service";
import { ClientesRepository } from "../clientes/clientes.repository";
import { VeiculosRepository } from "../veiculos/veiculos.repository";
import { InsumosRepository } from "../insumos/insumos.repository";
import { ServicosRepository } from "../servicos/servicos.repository";
import { AddItemInsumoDto, AddItemServicoDto } from "./dto/add-item.dto";
import { CreateOsDto } from "./dto/create-os.dto";
import { ListarOsDto } from "./dto/listar-os.dto";
import { UpdateDiagnosticoDto } from "./dto/update-diagnostico.dto";
import { AprovacaoPublicaDto, CancelarOsDto, DesbloquearOsDto } from "./dto/transicao.dto";
import { canTransition, nextStatus, OsTransition } from "./fluxo-estados-os";
import { OrdensServicoRepository } from "./ordens-servico.repository";

@Injectable()
export class OrdensServicoService {
	private readonly logger = new Logger(OrdensServicoService.name);

	constructor(
		private readonly repo: OrdensServicoRepository,
		private readonly prisma: PrismaService,
		private readonly clientes: ClientesRepository,
		private readonly veiculos: VeiculosRepository,
		private readonly servicos: ServicosRepository,
		private readonly insumos: InsumosRepository,
	) {}

	async create(dto: CreateOsDto): Promise<IServiceResponse<unknown>> {
		const cliente = await this.clientes.findById(dto.clienteId);
		if (!cliente) return SR.notFound(undefined, "Cliente não encontrado");
		if (cliente.ativo === false) return SR.unprocessableEntity(undefined, "Cliente inativado");

		const veiculo = await this.veiculos.findById(dto.veiculoId);
		if (!veiculo) return SR.notFound(undefined, "Veículo não encontrado");
		if (veiculo.ativo === false) return SR.unprocessableEntity(undefined, "Veículo inativado");
		if (veiculo.clienteId !== dto.clienteId) return SR.badRequest(undefined, "Veículo não pertence ao cliente informado");

		const numero = await this.proximoNumero();
		const created = await this.prisma.$transaction(async (tx) => {
			const os = await tx.ordemServico.create({
				data: { numero, clienteId: dto.clienteId, veiculoId: dto.veiculoId },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: null,
					statusNovo: OsStatus.RECEBIDA,
					observacao: "Ordem de serviço criada",
				},
			});
			return os;
		});

		const detalhe = await this.repo.findByIdFull(created.id);
		return SR.created(detalhe, "OS criada");
	}

	async findById(id: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByIdFull(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		return SR.ok(os);
	}

	async list(query: ListarOsDto): Promise<IServiceResponse<unknown>> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 20;

		const [total, items] = await this.repo.list({
			status: query.status,
			clienteId: query.clienteId,
			skip: (page - 1) * pageSize,
			take: pageSize,
		});

		return SR.ok({ total, page, pageSize, items });
	}

	async obterHistorico(id: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		const historico = await this.repo.findHistorico(id);
		return SR.ok(historico);
	}

	async iniciarDiagnostico(id: string, usuarioId: string): Promise<IServiceResponse<unknown>> {
		return this.transicao(id, "iniciar_diagnostico", usuarioId);
	}

	async atualizarDiagnostico(id: string, dto: UpdateDiagnosticoDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Diagnóstico só pode ser atualizado quando a OS está em diagnóstico");

		await this.prisma.ordemServico.update({
			where: { id },
			data: { diagnostico: dto.diagnostico },
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Diagnóstico atualizado");
	}

	async addItemServico(id: string, dto: AddItemServicoDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser adicionados antes da geração do orçamento");

		const servico = await this.servicos.findById(dto.servicoId);
		if (!servico) return SR.notFound(undefined, "Serviço não encontrado");
		if (servico.ativo === false) return SR.unprocessableEntity(undefined, "Serviço inativado");

		const quantidade = dto.quantidade ?? 1;
		const subtotal = new Prisma.Decimal(servico.preco).mul(quantidade);

		await this.prisma.osItemServico.create({
			data: {
				ordemServicoId: id,
				servicoId: servico.id,
				status: OsItemServicoStatus.PENDENTE,
				precoUnitario: servico.preco,
				quantidade,
				subtotal,
			},
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.created(detalhe, "Item de serviço adicionado");
	}

	async removerItemServico(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser removidos antes da geração do orçamento");

		const item = await this.prisma.osItemServico.findUnique({ where: { id: itemId } });
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");

		await this.prisma.osItemServico.delete({ where: { id: itemId } });

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Item removido");
	}

	async iniciarItemServico(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.EM_EXECUCAO)
			return SR.unprocessableEntity(undefined, "Serviço só pode ser iniciado com a OS em execução");

		const item = await this.prisma.osItemServico.findUnique({ where: { id: itemId } });
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");
		if (item.status !== OsItemServicoStatus.PENDENTE)
			return SR.unprocessableEntity(undefined, "Somente serviço pendente pode ser iniciado");

		const agora = new Date();
		await this.prisma.$transaction(async (tx) => {
			await tx.osItemServico.update({
				where: { id: itemId },
				data: { status: OsItemServicoStatus.EM_EXECUCAO, iniciadoExecucaoEm: agora },
			});
			if (!os.iniciadoExecucaoEm) {
				await tx.ordemServico.update({
					where: { id },
					data: { iniciadoExecucaoEm: agora },
				});
			}
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Serviço iniciado");
	}

	async concluirItemServico(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.EM_EXECUCAO)
			return SR.unprocessableEntity(undefined, "Serviço só pode ser concluído com a OS em execução");

		const item = await this.prisma.osItemServico.findUnique({ where: { id: itemId } });
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");
		if (item.status !== OsItemServicoStatus.EM_EXECUCAO)
			return SR.unprocessableEntity(undefined, "Somente serviço em execução pode ser concluído");

		const agora = new Date();
		const iniciadoExecucaoEm = item.iniciadoExecucaoEm ?? agora;
		await this.prisma.osItemServico.update({
			where: { id: itemId },
			data: {
				status: OsItemServicoStatus.CONCLUIDO,
				iniciadoExecucaoEm,
				finalizadoExecucaoEm: agora,
			},
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Serviço concluído");
	}

	async cancelarItemServico(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.EM_EXECUCAO)
			return SR.unprocessableEntity(undefined, "Serviço só pode ser cancelado com a OS em execução");

		const item = await this.prisma.osItemServico.findUnique({ where: { id: itemId } });
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");
		if (item.status === OsItemServicoStatus.CONCLUIDO || item.status === OsItemServicoStatus.CANCELADO)
			return SR.unprocessableEntity(undefined, "Serviço já concluído ou cancelado");

		await this.prisma.osItemServico.update({
			where: { id: itemId },
			data: { status: OsItemServicoStatus.CANCELADO },
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Serviço cancelado");
	}

	async addItemInsumo(id: string, dto: AddItemInsumoDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser adicionados antes da geração do orçamento");

		const insumo = await this.insumos.findById(dto.insumoId);
		if (!insumo) return SR.notFound(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity(undefined, "Insumo inativado");
		if (insumo.quantidadeEstoque < dto.quantidade)
			return SR.unprocessableEntity(undefined, `Estoque insuficiente. Disponível: ${insumo.quantidadeEstoque}`);

		const subtotal = new Prisma.Decimal(insumo.precoUnitario).mul(dto.quantidade);
		await this.prisma.osItemInsumo.create({
			data: {
				ordemServicoId: id,
				insumoId: insumo.id,
				precoUnitario: insumo.precoUnitario,
				quantidade: dto.quantidade,
				subtotal,
			},
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.created(detalhe, "Insumo adicionado");
	}

	async removerItemInsumo(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser removidos antes da geração do orçamento");

		const item = await this.prisma.osItemInsumo.findUnique({ where: { id: itemId } });
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");

		await this.prisma.osItemInsumo.delete({ where: { id: itemId } });

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Item removido");
	}

	async gerarOrcamento(id: string, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByIdFull(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "gerar_orcamento"))
			return SR.unprocessableEntity(undefined, `Não é possível gerar orçamento a partir do status ${os.status}`);

		if (os.itensServico.length === 0)
			return SR.unprocessableEntity(undefined, "Adicione ao menos um serviço antes de gerar o orçamento");

		const valorTotal = this.calcularTotal(os);
		await this.prisma.$transaction(async (tx) => {
			await tx.ordemServico.update({
				where: { id },
				data: { valorTotal, status: OsStatus.AGUARDANDO_APROVACAO },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: id,
					statusAnterior: os.status,
					statusNovo: OsStatus.AGUARDANDO_APROVACAO,
					usuarioId,
					observacao: "Orçamento gerado",
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "Orçamento gerado");
	}

	async aprovarOrcamento(numero: string, dto: AprovacaoPublicaDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByNumero(numero);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (normalizeCpfOrCnpj(dto.documento) !== os.cliente.documento)
			return SR.forbidden(undefined, "Documento não confere com o cliente da OS");

		if (!canTransition(os.status, "aprovar_orcamento"))
			return SR.unprocessableEntity(undefined, `Não é possível aprovar a OS no status ${os.status}`);

		const agora = new Date();
		let bloqueadaPorFaltaEstoque = false;
		await this.prisma.$transaction(async (tx) => {
			const planoBaixa = await this.montarPlanoBaixaEstoque(tx, os.itensInsumo);
			if (planoBaixa.faltantes.length > 0) {
				bloqueadaPorFaltaEstoque = true;
				await tx.ordemServico.update({
					where: { id: os.id },
					data: {
						status: OsStatus.BLOQUEADA,
						aprovadoEm: agora,
					},
				});
				await tx.osHistoricoStatus.create({
					data: {
						ordemServicoId: os.id,
						statusAnterior: os.status,
						statusNovo: OsStatus.BLOQUEADA,
						observacao: dto.observacao ?? `Orçamento aprovado, OS bloqueada por falta de estoque: ${planoBaixa.faltantes.join("; ")}`,
					},
				});
				return;
			}
			await this.aplicarBaixaEstoque(tx, os.id, planoBaixa.reservas, "Saída por aprovação de OS (cliente)", null);
			await tx.ordemServico.update({
				where: { id: os.id },
				data: {
					status: OsStatus.EM_EXECUCAO,
					aprovadoEm: agora,
					iniciadoExecucaoEm: agora,
				},
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: os.status,
					statusNovo: OsStatus.EM_EXECUCAO,
					observacao: dto.observacao ?? "Orçamento aprovado pelo cliente",
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(os.id);
		if (bloqueadaPorFaltaEstoque) return SR.ok(detalhe, "Orçamento aprovado e OS bloqueada por falta de estoque");

		return SR.ok(detalhe, "Orçamento aprovado");
	}

	async rejeitarOrcamento(numero: string, dto: AprovacaoPublicaDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByNumero(numero);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (normalizeCpfOrCnpj(dto.documento) !== os.cliente.documento)
			return SR.forbidden(undefined, "Documento não confere com o cliente da OS");

		if (!canTransition(os.status, "rejeitar_orcamento"))
			return SR.unprocessableEntity(undefined, `Não é possível rejeitar a OS no status ${os.status}`);

		await this.prisma.$transaction(async (tx) => {
			await tx.ordemServico.update({
				where: { id: os.id },
				data: { status: OsStatus.CANCELADA, canceladoEm: new Date() },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: os.status,
					statusNovo: OsStatus.CANCELADA,
					observacao: dto.observacao ?? "Orçamento rejeitado pelo cliente",
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(os.id);
		return SR.ok(detalhe, "Orçamento rejeitado");
	}

	async finalizar(id: string, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByIdFull(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "finalizar"))
			return SR.unprocessableEntity(undefined, `Transição inválida a partir do status ${os.status}`);

		if (os.itensServico.length === 0) return SR.unprocessableEntity(undefined, "A OS precisa ter ao menos um serviço");

		const pendentes = os.itensServico.some(
			(item) => item.status !== OsItemServicoStatus.CONCLUIDO && item.status !== OsItemServicoStatus.CANCELADO,
		);
		if (pendentes) {
			return SR.unprocessableEntity(
				undefined,
				"Só é possível finalizar a OS quando todos os serviços estiverem concluídos ou cancelados",
			);
		}

		const novo = nextStatus("finalizar");
		const agora = new Date();
		await this.prisma.$transaction(async (tx) => {
			await tx.ordemServico.update({
				where: { id },
				data: { finalizadoEm: agora, status: novo },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: id,
					statusAnterior: os.status,
					statusNovo: novo,
					usuarioId,
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, `Status atualizado para ${novo}`);
	}

	async entregar(id: string, usuarioId: string): Promise<IServiceResponse<unknown>> {
		return this.transicao(id, "entregar", usuarioId, {
			entregueEm: new Date(),
		});
	}

	async desbloquear(id: string, usuarioId: string, dto: DesbloquearOsDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByIdFull(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "desbloquear"))
			return SR.unprocessableEntity(undefined, `Não é possível desbloquear a OS no status ${os.status}`);

		const agora = new Date();
		const resultado = await this.prisma.$transaction(async (tx) => {
			const planoBaixa = await this.montarPlanoBaixaEstoque(tx, os.itensInsumo);
			if (planoBaixa.faltantes.length > 0) return { faltantes: planoBaixa.faltantes };
			await this.aplicarBaixaEstoque(tx, id, planoBaixa.reservas, "Saída por desbloqueio de OS", usuarioId);
			await tx.ordemServico.update({
				where: { id },
				data: {
					status: nextStatus("desbloquear"),
					iniciadoExecucaoEm: os.iniciadoExecucaoEm ?? agora,
				},
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: id,
					statusAnterior: os.status,
					statusNovo: nextStatus("desbloquear"),
					observacao: dto.observacao ?? "OS desbloqueada após validação de estoque",
					usuarioId,
				},
			});
			return { faltantes: [] as string[] };
		});

		if (resultado.faltantes.length > 0) {
			return SR.unprocessableEntity(
				undefined,
				`Não é possível desbloquear a OS sem estoque disponível: ${resultado.faltantes.join("; ")}`,
			);
		}

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "OS desbloqueada");
	}

	async cancelar(id: string, usuarioId: string, dto: CancelarOsDto): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByIdFull(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "cancelar"))
			return SR.unprocessableEntity(undefined, `Não é possível cancelar a OS no status ${os.status}`);

		const precisaEstornar = !!os.aprovadoEm && os.status !== OsStatus.BLOQUEADA;
		await this.prisma.$transaction(async (tx) => {
			if (precisaEstornar) {
				for (const item of os.itensInsumo) {
					const insumo = await tx.insumo.findUnique({ where: { id: item.insumoId } });
					if (!insumo) continue;
					const posterior = insumo.quantidadeEstoque + item.quantidade;
					await tx.insumo.update({
						where: { id: insumo.id },
						data: { quantidadeEstoque: posterior },
					});
					await tx.movimentoEstoque.create({
						data: {
							insumoId: insumo.id,
							tipo: TipoMovimentoEstoque.ESTORNO,
							quantidade: item.quantidade,
							quantidadeAnterior: insumo.quantidadeEstoque,
							quantidadePosterior: posterior,
							ordemServicoId: id,
							motivo: "Estorno por cancelamento de OS",
							usuarioId,
						},
					});
				}
			}
			await tx.ordemServico.update({
				where: { id },
				data: { status: OsStatus.CANCELADA, canceladoEm: new Date() },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: id,
					statusAnterior: os.status,
					statusNovo: OsStatus.CANCELADA,
					observacao: dto.motivo ?? "OS cancelada",
					usuarioId,
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, "OS cancelada");
	}

	async consultaPublica(numero: string, documento: string): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findByNumero(numero);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (normalizeCpfOrCnpj(documento) !== os.cliente.documento)
			return SR.forbidden(undefined, "Documento não confere com o cliente da OS");

		const nomeMascarado = this.mascararNome(os.cliente.nome);

		return SR.ok({
			numero: os.numero,
			cliente: nomeMascarado,
			veiculo: { placa: os.veiculo.placa, marca: os.veiculo.marca, modelo: os.veiculo.modelo },
			status: os.status,
			diagnostico: os.diagnostico,
			valorTotal: os.valorTotal,
			itensServico: os.itensServico.map((i) => ({
				nome: i.servico.nome,
				status: i.status,
				iniciadoExecucaoEm: i.iniciadoExecucaoEm,
				finalizadoExecucaoEm: i.finalizadoExecucaoEm,
				quantidade: i.quantidade,
				precoUnitario: i.precoUnitario,
				subtotal: i.subtotal,
			})),
			itensInsumo: os.itensInsumo.map((i) => ({
				nome: i.insumo.nome,
				quantidade: i.quantidade,
				precoUnitario: i.precoUnitario,
				subtotal: i.subtotal,
			})),
			historico: os.historico.map((h) => ({
				statusAnterior: h.statusAnterior,
				statusNovo: h.statusNovo,
				observacao: h.observacao,
				em: h.createdAt,
			})),
		});
	}

	async tempoMedioExecucao(filtro: "ativos" | "inativos" | "ambos" = "ativos"): Promise<IServiceResponse<unknown>> {
		const dados = await this.repo.tempoMedioPorServico(filtro);
		return SR.ok(
			dados.map((d) => ({
				servicoId: d.servico_id,
				nome: d.nome,
				ativo: d.ativo,
				tempoMedioMin: d.tempo_medio_min,
				totalExecucoes: d.total_execucoes,
			})),
		);
	}

	private async transicao(
		id: string,
		transition: OsTransition,
		usuarioId: string,
		extraData: Prisma.OrdemServicoUpdateInput = {},
	): Promise<IServiceResponse<unknown>> {
		const os = await this.repo.findById(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, transition))
			return SR.unprocessableEntity(undefined, `Transição inválida a partir do status ${os.status}`);

		const novo = nextStatus(transition);
		await this.prisma.$transaction(async (tx) => {
			await tx.ordemServico.update({
				where: { id },
				data: { ...extraData, status: novo },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: id,
					statusAnterior: os.status,
					statusNovo: novo,
					usuarioId,
				},
			});
		});

		const detalhe = await this.repo.findByIdFull(id);
		return SR.ok(detalhe, `Status atualizado para ${novo}`);
	}

	private async montarPlanoBaixaEstoque(
		tx: Prisma.TransactionClient,
		itens: { insumoId: string; quantidade: number }[],
	): Promise<{
		faltantes: string[];
		reservas: {
			insumoId: string;
			codigo: string;
			nome: string;
			quantidade: number;
			anterior: number;
			posterior: number;
			estoqueMinimo: number;
		}[];
	}> {
		const faltantes: string[] = [];
		const reservas: {
			insumoId: string;
			codigo: string;
			nome: string;
			quantidade: number;
			anterior: number;
			posterior: number;
			estoqueMinimo: number;
		}[] = [];

		for (const item of itens) {
			const insumo = await tx.insumo.findUnique({ where: { id: item.insumoId } });
			if (!insumo) {
				faltantes.push(`Insumo ${item.insumoId} não encontrado`);
				continue;
			}

			const posterior = insumo.quantidadeEstoque - item.quantidade;
			if (posterior < 0) {
				faltantes.push(`${insumo.nome} (${insumo.quantidadeEstoque} disponíveis, ${item.quantidade} requisitados)`);
				continue;
			}

			reservas.push({
				insumoId: insumo.id,
				codigo: insumo.codigo,
				nome: insumo.nome,
				quantidade: item.quantidade,
				anterior: insumo.quantidadeEstoque,
				posterior,
				estoqueMinimo: insumo.estoqueMinimo,
			});
		}

		return { faltantes, reservas };
	}

	private async aplicarBaixaEstoque(
		tx: Prisma.TransactionClient,
		ordemServicoId: string,
		reservas: {
			insumoId: string;
			codigo: string;
			nome: string;
			quantidade: number;
			anterior: number;
			posterior: number;
			estoqueMinimo: number;
		}[],
		motivo: string,
		usuarioId: string | null,
	): Promise<void> {
		for (const reserva of reservas) {
			await tx.insumo.update({
				where: { id: reserva.insumoId },
				data: { quantidadeEstoque: reserva.posterior },
			});

			await tx.movimentoEstoque.create({
				data: {
					insumoId: reserva.insumoId,
					tipo: TipoMovimentoEstoque.SAIDA,
					quantidade: reserva.quantidade,
					quantidadeAnterior: reserva.anterior,
					quantidadePosterior: reserva.posterior,
					ordemServicoId,
					motivo,
					usuarioId,
				},
			});

			if (reserva.posterior < reserva.estoqueMinimo) {
				this.logger.warn(`Insumo ${reserva.codigo} ficou abaixo do estoque mínimo (${reserva.posterior}/${reserva.estoqueMinimo})`);
			}
		}
	}

	private calcularTotal(os: {
		itensServico: { subtotal: Prisma.Decimal }[];
		itensInsumo: { subtotal: Prisma.Decimal }[];
	}): Prisma.Decimal {
		const zero = new Prisma.Decimal(0);
		const totalServicos = os.itensServico.reduce((acc, i) => acc.add(i.subtotal), zero);
		const totalInsumos = os.itensInsumo.reduce((acc, i) => acc.add(i.subtotal), zero);
		return totalServicos.add(totalInsumos);
	}

	private mascararNome(nome: string): string {
		const partes = nome.trim().split(/\s+/);
		if (partes.length === 1) {
			const unico = partes[0];
			return unico[0] + "*".repeat(Math.max(unico.length - 1, 1));
		}

		return partes
			.map((p, i) => {
				if (i === 0) return p;
				if (partes.length > 2 && i === partes.length - 1) return p;
				return p[0] + "*".repeat(Math.max(p.length - 1, 1));
			})
			.join(" ");
	}

	private async proximoNumero(): Promise<string> {
		const ano = new Date().getUTCFullYear();
		const count = await this.repo.contadorAno(ano);
		const seq = String(count + 1).padStart(6, "0");
		return `OS-${ano}-${seq}`;
	}
}
