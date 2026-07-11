import { OsStatus } from "../../domain/os-status";

export const NOTIFICADOR = Symbol("NOTIFICADOR");

export interface NotificacaoMudancaStatus {
	numeroOs: string;
	statusAnterior: OsStatus | null;
	statusNovo: OsStatus;
	nomeCliente: string;
	emailCliente: string | null;
	observacao?: string | null;
}

export interface NotificadorPort {
	notificarMudancaStatus(n: NotificacaoMudancaStatus): Promise<void>;
}
