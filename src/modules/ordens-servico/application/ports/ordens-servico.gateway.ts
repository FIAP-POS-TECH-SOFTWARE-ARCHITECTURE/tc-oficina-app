import { OsStatus } from "../../domain/os-status";
import { HistoricoItemApp, OsChaveOrdenacao, OsDetalhe, OsResumo, TempoMedioServicoApp } from "./os-types";

export const ORDENS_SERVICO_GATEWAY = Symbol("ORDENS_SERVICO_GATEWAY");

export interface TransicaoPersistencia {
	id: string;
	statusAnterior: OsStatus;
	statusNovo: OsStatus;
	usuarioId?: string | null;
	observacao?: string | null;
	dadosExtras?: {
		aprovadoEm?: Date;
		iniciadoExecucaoEm?: Date;
		finalizadoEm?: Date;
		entregueEm?: Date;
		canceladoEm?: Date;
		valorTotal?: unknown;
	};
}

export interface ResultadoAprovacao {
	bloqueadaPorFaltaEstoque: boolean;
	faltantes: string[];
}

export interface OrdensServicoGatewayPort {
	criarComHistorico(dados: { numero: string; clienteId: string; veiculoId: string }): Promise<{ id: string }>;
	buscarPorId(id: string): Promise<OsResumo | null>;
	buscarDetalhePorId(id: string): Promise<OsDetalhe | null>;
	buscarPorNumero(numero: string): Promise<OsDetalhe | null>;
	listarParaOrdenacao(filtros: { status?: OsStatus; excluirStatus?: OsStatus[]; clienteId?: string }): Promise<OsChaveOrdenacao[]>;
	buscarDetalhesPorIds(ids: string[]): Promise<OsDetalhe[]>;
	listarHistorico(ordemServicoId: string): Promise<HistoricoItemApp[]>;
	contarPorAno(ano: number): Promise<number>;
	tempoMedioPorServico(filtro: "ativos" | "inativos" | "ambos"): Promise<TempoMedioServicoApp[]>;

	atualizarDiagnostico(id: string, diagnostico: string): Promise<void>;
	transicionarComHistorico(t: TransicaoPersistencia): Promise<void>;
	calcularTotal(os: OsDetalhe): unknown;

	criarItemServico(dados: { ordemServicoId: string; servicoId: string; precoUnitario: unknown; quantidade: number }): Promise<void>;
	buscarItemServico(
		itemId: string,
	): Promise<{ id: string; ordemServicoId: string; status: string; iniciadoExecucaoEm: Date | null } | null>;
	removerItemServico(itemId: string): Promise<void>;
	iniciarItemServico(params: { osId: string; itemId: string; agora: Date; marcarInicioOs: boolean }): Promise<void>;
	concluirItemServico(params: { itemId: string; iniciadoExecucaoEm: Date; finalizadoExecucaoEm: Date }): Promise<void>;
	cancelarItemServico(itemId: string): Promise<void>;

	criarItemInsumo(dados: { ordemServicoId: string; insumoId: string; precoUnitario: unknown; quantidade: number }): Promise<void>;
	buscarItemInsumo(itemId: string): Promise<{ id: string; ordemServicoId: string } | null>;
	removerItemInsumo(itemId: string): Promise<void>;

	// Fluxos com estoque, atômicos por exigência de consistência; a política
	// (bloquear se faltar estoque / estornar) é decidida pelo caso de uso e
	// executada dentro da transação do gateway.
	executarAprovacao(os: OsDetalhe, observacao: string | null | undefined, agora: Date): Promise<ResultadoAprovacao>;
	executarDesbloqueio(
		os: OsDetalhe,
		usuarioId: string,
		observacao: string | null | undefined,
		agora: Date,
	): Promise<{ faltantes: string[] }>;
	executarCancelamento(
		os: OsDetalhe,
		usuarioId: string | null,
		motivo: string | null | undefined,
		estornarEstoque: boolean,
	): Promise<void>;
}
