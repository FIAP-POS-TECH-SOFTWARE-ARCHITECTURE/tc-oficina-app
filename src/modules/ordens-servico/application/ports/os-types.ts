import { OsStatus } from "../../domain/os-status";

export type OsItemServicoStatusApp = "PENDENTE" | "EM_EXECUCAO" | "CONCLUIDO" | "CANCELADO";

export interface OsResumo {
	id: string;
	numero: string;
	status: OsStatus;
	diagnostico: string | null;
	aprovadoEm: Date | null;
	iniciadoExecucaoEm: Date | null;
	createdAt: Date;
	[extra: string]: unknown;
}

export interface OsItemServicoApp {
	id: string;
	servicoId: string;
	status: OsItemServicoStatusApp;
	quantidade: number;
	precoUnitario: unknown; // Prisma.Decimal — opaco para a aplicação
	subtotal: unknown;
	iniciadoExecucaoEm: Date | null;
	finalizadoExecucaoEm: Date | null;
	servico: { nome: string; [extra: string]: unknown };
	[extra: string]: unknown;
}

export interface OsItemInsumoApp {
	id: string;
	insumoId: string;
	quantidade: number;
	precoUnitario: unknown;
	subtotal: unknown;
	insumo: { nome: string; [extra: string]: unknown };
	[extra: string]: unknown;
}

export interface OsDetalhe extends OsResumo {
	valorTotal: unknown;
	cliente: { nome: string; documento: string; email: string | null; [extra: string]: unknown };
	veiculo: { placa: string; marca: string; modelo: string; [extra: string]: unknown };
	itensServico: OsItemServicoApp[];
	itensInsumo: OsItemInsumoApp[];
	historico: {
		statusAnterior: OsStatus | null;
		statusNovo: OsStatus;
		observacao: string | null;
		createdAt: Date;
		[extra: string]: unknown;
	}[];
}

export interface HistoricoItemApp {
	statusAnterior: OsStatus | null;
	statusNovo: OsStatus;
	observacao: string | null;
	createdAt: Date;
	usuario: unknown;
	[extra: string]: unknown;
}

export interface TempoMedioServicoApp {
	servico_id: string;
	nome: string;
	ativo: boolean;
	tempo_medio_min: number | null;
	total_execucoes: number;
}
