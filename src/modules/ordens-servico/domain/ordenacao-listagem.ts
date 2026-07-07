import { OsStatus } from "./os-status";

// §5.4: Em Execução > Aguardando Aprovação > Diagnóstico > Recebida.
// BLOQUEADA e CANCELADA (status da Fase 1) ordenam após as prioridades da spec.
export const PRIORIDADE_LISTAGEM: OsStatus[] = [
	OsStatus.EM_EXECUCAO,
	OsStatus.AGUARDANDO_APROVACAO,
	OsStatus.EM_DIAGNOSTICO,
	OsStatus.RECEBIDA,
	OsStatus.BLOQUEADA,
	OsStatus.CANCELADA,
];

// §5.4: exclusão lógica — Finalizadas e Entregues não aparecem na listagem padrão.
export const STATUS_OCULTOS_LISTAGEM: OsStatus[] = [OsStatus.FINALIZADA, OsStatus.ENTREGUE];

export function compararParaListagem(
	a: { status: OsStatus; createdAt: Date },
	b: { status: OsStatus; createdAt: Date },
): number {
	const prioridade = PRIORIDADE_LISTAGEM.indexOf(a.status) - PRIORIDADE_LISTAGEM.indexOf(b.status);
	if (prioridade !== 0) return prioridade;
	return a.createdAt.getTime() - b.createdAt.getTime();
}
