import { Injectable, Logger } from "@nestjs/common";
import { OsItemServicoStatus, OsStatus as PrismaOsStatus, Prisma, TipoMovimentoEstoque } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { OsStatus } from "../../domain/os-status";
import { OrdensServicoGatewayPort, ResultadoAprovacao, TransicaoPersistencia } from "../../application/ports/ordens-servico.gateway";
import { HistoricoItemApp, OsDetalhe, OsResumo, TempoMedioServicoApp } from "../../application/ports/os-types";

const OS_INCLUDE = {
	cliente: true,
	veiculo: true,
	itensServico: { include: { servico: true } },
	itensInsumo: { include: { insumo: true } },
	historico: { orderBy: { createdAt: "asc" } as const },
} satisfies Prisma.OrdemServicoInclude;

interface ReservaEstoque {
	insumoId: string;
	codigo: string;
	nome: string;
	quantidade: number;
	anterior: number;
	posterior: number;
	estoqueMinimo: number;
}

@Injectable()
export class OrdensServicoPrismaGateway implements OrdensServicoGatewayPort {
	private readonly logger = new Logger(OrdensServicoPrismaGateway.name);

	constructor(private readonly prisma: PrismaService) {}

	async criarComHistorico(dados: { numero: string; clienteId: string; veiculoId: string }): Promise<{ id: string }> {
		return this.prisma.$transaction(async (tx) => {
			const os = await tx.ordemServico.create({
				data: { numero: dados.numero, clienteId: dados.clienteId, veiculoId: dados.veiculoId },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: null,
					statusNovo: PrismaOsStatus.RECEBIDA,
					observacao: "Ordem de serviço criada",
				},
			});
			return { id: os.id };
		});
	}

	async buscarPorId(id: string): Promise<OsResumo | null> {
		const os = await this.prisma.ordemServico.findUnique({ where: { id } });
		return os as unknown as OsResumo | null;
	}

	async buscarDetalhePorId(id: string): Promise<OsDetalhe | null> {
		const os = await this.prisma.ordemServico.findUnique({
			where: { id },
			include: OS_INCLUDE,
		});
		return os as unknown as OsDetalhe | null;
	}

	async buscarPorNumero(numero: string): Promise<OsDetalhe | null> {
		const os = await this.prisma.ordemServico.findUnique({
			where: { numero },
			include: OS_INCLUDE,
		});
		return os as unknown as OsDetalhe | null;
	}

	async listar(params: { status?: OsStatus; clienteId?: string; skip: number; take: number }): Promise<[number, OsDetalhe[]]> {
		const where: Prisma.OrdemServicoWhereInput = {};
		if (params.status) where.status = params.status;
		if (params.clienteId) where.clienteId = params.clienteId;
		const [total, items] = await this.prisma.$transaction([
			this.prisma.ordemServico.count({ where }),
			this.prisma.ordemServico.findMany({
				where,
				skip: params.skip,
				take: params.take,
				orderBy: { createdAt: "desc" },
				include: OS_INCLUDE,
			}),
		]);
		return [total, items as unknown as OsDetalhe[]];
	}

	async listarHistorico(ordemServicoId: string): Promise<HistoricoItemApp[]> {
		const historico = await this.prisma.osHistoricoStatus.findMany({
			where: { ordemServicoId },
			include: { usuario: true },
			orderBy: { createdAt: "asc" },
		});
		return historico as unknown as HistoricoItemApp[];
	}

	contarPorAno(ano: number): Promise<number> {
		return this.prisma.ordemServico.count({
			where: {
				createdAt: {
					gte: new Date(`${ano}-01-01T00:00:00Z`),
					lt: new Date(`${ano + 1}-01-01T00:00:00Z`),
				},
			},
		});
	}

	tempoMedioPorServico(filtro: "ativos" | "inativos" | "ambos"): Promise<TempoMedioServicoApp[]> {
		const condicao =
			filtro === "ativos"
				? Prisma.sql`WHERE s.ativo = true`
				: filtro === "inativos"
					? Prisma.sql`WHERE s.ativo = false`
					: Prisma.sql``;

		return this.prisma.$queryRaw<TempoMedioServicoApp[]>`
			SELECT
				s.id AS servico_id,
				s.nome,
				s.ativo,
				AVG(EXTRACT(EPOCH FROM (ois.finalizado_execucao_em - ois.iniciado_execucao_em)) / 60)::float AS tempo_medio_min,
				COUNT(ois.id)::int AS total_execucoes
			FROM servicos s
			LEFT JOIN os_itens_servico ois
				ON ois.servico_id = s.id
				AND ois.status = 'CONCLUIDO'
				AND ois.finalizado_execucao_em IS NOT NULL
				AND ois.iniciado_execucao_em IS NOT NULL
			${condicao}
			GROUP BY s.id, s.nome, s.ativo
			ORDER BY s.nome ASC
		`;
	}

	async atualizarDiagnostico(id: string, diagnostico: string): Promise<void> {
		await this.prisma.ordemServico.update({
			where: { id },
			data: { diagnostico },
		});
	}

	async transicionarComHistorico(t: TransicaoPersistencia): Promise<void> {
		const extras = (t.dadosExtras ?? {}) as Prisma.OrdemServicoUpdateInput;
		await this.prisma.$transaction(async (tx) => {
			await tx.ordemServico.update({
				where: { id: t.id },
				data: { ...extras, status: t.statusNovo },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: t.id,
					statusAnterior: t.statusAnterior,
					statusNovo: t.statusNovo,
					usuarioId: t.usuarioId ?? undefined,
					observacao: t.observacao ?? undefined,
				},
			});
		});
	}

	calcularTotal(os: OsDetalhe): unknown {
		const zero = new Prisma.Decimal(0);
		const totalServicos = os.itensServico.reduce((acc, i) => acc.add(i.subtotal as Prisma.Decimal), zero);
		const totalInsumos = os.itensInsumo.reduce((acc, i) => acc.add(i.subtotal as Prisma.Decimal), zero);
		return totalServicos.add(totalInsumos);
	}

	async criarItemServico(dados: {
		ordemServicoId: string;
		servicoId: string;
		precoUnitario: unknown;
		quantidade: number;
	}): Promise<void> {
		const precoUnitario = dados.precoUnitario as Prisma.Decimal;
		const subtotal = new Prisma.Decimal(precoUnitario).mul(dados.quantidade);
		await this.prisma.osItemServico.create({
			data: {
				ordemServicoId: dados.ordemServicoId,
				servicoId: dados.servicoId,
				status: OsItemServicoStatus.PENDENTE,
				precoUnitario,
				quantidade: dados.quantidade,
				subtotal,
			},
		});
	}

	buscarItemServico(
		itemId: string,
	): Promise<{ id: string; ordemServicoId: string; status: string; iniciadoExecucaoEm: Date | null } | null> {
		return this.prisma.osItemServico.findUnique({ where: { id: itemId } });
	}

	async removerItemServico(itemId: string): Promise<void> {
		await this.prisma.osItemServico.delete({ where: { id: itemId } });
	}

	async iniciarItemServico(params: { osId: string; itemId: string; agora: Date; marcarInicioOs: boolean }): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await tx.osItemServico.update({
				where: { id: params.itemId },
				data: { status: OsItemServicoStatus.EM_EXECUCAO, iniciadoExecucaoEm: params.agora },
			});
			if (params.marcarInicioOs) {
				await tx.ordemServico.update({
					where: { id: params.osId },
					data: { iniciadoExecucaoEm: params.agora },
				});
			}
		});
	}

	async concluirItemServico(params: { itemId: string; iniciadoExecucaoEm: Date; finalizadoExecucaoEm: Date }): Promise<void> {
		await this.prisma.osItemServico.update({
			where: { id: params.itemId },
			data: {
				status: OsItemServicoStatus.CONCLUIDO,
				iniciadoExecucaoEm: params.iniciadoExecucaoEm,
				finalizadoExecucaoEm: params.finalizadoExecucaoEm,
			},
		});
	}

	async cancelarItemServico(itemId: string): Promise<void> {
		await this.prisma.osItemServico.update({
			where: { id: itemId },
			data: { status: OsItemServicoStatus.CANCELADO },
		});
	}

	async criarItemInsumo(dados: {
		ordemServicoId: string;
		insumoId: string;
		precoUnitario: unknown;
		quantidade: number;
	}): Promise<void> {
		const precoUnitario = dados.precoUnitario as Prisma.Decimal;
		const subtotal = new Prisma.Decimal(precoUnitario).mul(dados.quantidade);
		await this.prisma.osItemInsumo.create({
			data: {
				ordemServicoId: dados.ordemServicoId,
				insumoId: dados.insumoId,
				precoUnitario,
				quantidade: dados.quantidade,
				subtotal,
			},
		});
	}

	buscarItemInsumo(itemId: string): Promise<{ id: string; ordemServicoId: string } | null> {
		return this.prisma.osItemInsumo.findUnique({ where: { id: itemId } });
	}

	async removerItemInsumo(itemId: string): Promise<void> {
		await this.prisma.osItemInsumo.delete({ where: { id: itemId } });
	}

	async executarAprovacao(os: OsDetalhe, observacao: string | null | undefined, agora: Date): Promise<ResultadoAprovacao> {
		let bloqueadaPorFaltaEstoque = false;
		let faltantes: string[] = [];
		await this.prisma.$transaction(async (tx) => {
			const planoBaixa = await this.montarPlanoBaixaEstoque(tx, os.itensInsumo);
			if (planoBaixa.faltantes.length > 0) {
				bloqueadaPorFaltaEstoque = true;
				faltantes = planoBaixa.faltantes;
				await tx.ordemServico.update({
					where: { id: os.id },
					data: {
						status: PrismaOsStatus.BLOQUEADA,
						aprovadoEm: agora,
					},
				});
				await tx.osHistoricoStatus.create({
					data: {
						ordemServicoId: os.id,
						statusAnterior: os.status,
						statusNovo: PrismaOsStatus.BLOQUEADA,
						observacao: observacao ?? `Orçamento aprovado, OS bloqueada por falta de estoque: ${planoBaixa.faltantes.join("; ")}`,
					},
				});
				return;
			}
			await this.aplicarBaixaEstoque(tx, os.id, planoBaixa.reservas, "Saída por aprovação de OS (cliente)", null);
			await tx.ordemServico.update({
				where: { id: os.id },
				data: {
					status: PrismaOsStatus.EM_EXECUCAO,
					aprovadoEm: agora,
					iniciadoExecucaoEm: agora,
				},
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: os.status,
					statusNovo: PrismaOsStatus.EM_EXECUCAO,
					observacao: observacao ?? "Orçamento aprovado pelo cliente",
				},
			});
		});
		return { bloqueadaPorFaltaEstoque, faltantes };
	}

	async executarDesbloqueio(
		os: OsDetalhe,
		usuarioId: string,
		observacao: string | null | undefined,
		agora: Date,
	): Promise<{ faltantes: string[] }> {
		return this.prisma.$transaction(async (tx) => {
			const planoBaixa = await this.montarPlanoBaixaEstoque(tx, os.itensInsumo);
			if (planoBaixa.faltantes.length > 0) return { faltantes: planoBaixa.faltantes };
			await this.aplicarBaixaEstoque(tx, os.id, planoBaixa.reservas, "Saída por desbloqueio de OS", usuarioId);
			await tx.ordemServico.update({
				where: { id: os.id },
				data: {
					status: PrismaOsStatus.EM_EXECUCAO,
					iniciadoExecucaoEm: os.iniciadoExecucaoEm ?? agora,
				},
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: os.status,
					statusNovo: PrismaOsStatus.EM_EXECUCAO,
					observacao: observacao ?? "OS desbloqueada após validação de estoque",
					usuarioId,
				},
			});
			return { faltantes: [] as string[] };
		});
	}

	async executarCancelamento(
		os: OsDetalhe,
		usuarioId: string | null,
		motivo: string | null | undefined,
		estornarEstoque: boolean,
	): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			if (estornarEstoque) {
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
							ordemServicoId: os.id,
							motivo: "Estorno por cancelamento de OS",
							usuarioId,
						},
					});
				}
			}
			await tx.ordemServico.update({
				where: { id: os.id },
				data: { status: PrismaOsStatus.CANCELADA, canceladoEm: new Date() },
			});
			await tx.osHistoricoStatus.create({
				data: {
					ordemServicoId: os.id,
					statusAnterior: os.status,
					statusNovo: PrismaOsStatus.CANCELADA,
					observacao: motivo ?? "OS cancelada",
					usuarioId,
				},
			});
		});
	}

	private async montarPlanoBaixaEstoque(
		tx: Prisma.TransactionClient,
		itens: { insumoId: string; quantidade: number }[],
	): Promise<{ faltantes: string[]; reservas: ReservaEstoque[] }> {
		const faltantes: string[] = [];
		const reservas: ReservaEstoque[] = [];

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
		reservas: ReservaEstoque[],
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
}
