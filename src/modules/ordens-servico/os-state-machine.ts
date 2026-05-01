import { OsStatus } from "../../common/enums/os-status.enum";

export type OsTransition =
	| "iniciar_diagnostico"
	| "gerar_orcamento"
	| "aprovar_orcamento"
	| "rejeitar_orcamento"
	| "finalizar"
	| "entregar"
	| "cancelar";

const TRANSITIONS: Record<OsTransition, { from: OsStatus[]; to: OsStatus }> = {
	iniciar_diagnostico: { from: [OsStatus.RECEBIDA], to: OsStatus.EM_DIAGNOSTICO },
	gerar_orcamento: { from: [OsStatus.EM_DIAGNOSTICO], to: OsStatus.AGUARDANDO_APROVACAO },
	aprovar_orcamento: { from: [OsStatus.AGUARDANDO_APROVACAO], to: OsStatus.EM_EXECUCAO },
	rejeitar_orcamento: { from: [OsStatus.AGUARDANDO_APROVACAO], to: OsStatus.CANCELADA },
	finalizar: { from: [OsStatus.EM_EXECUCAO], to: OsStatus.FINALIZADA },
	entregar: { from: [OsStatus.FINALIZADA], to: OsStatus.ENTREGUE },
	cancelar: {
		from: [OsStatus.RECEBIDA, OsStatus.EM_DIAGNOSTICO, OsStatus.AGUARDANDO_APROVACAO, OsStatus.EM_EXECUCAO, OsStatus.FINALIZADA],
		to: OsStatus.CANCELADA,
	},
};

export function canTransition(from: OsStatus, transition: OsTransition): boolean {
	return TRANSITIONS[transition].from.includes(from);
}

export function nextStatus(transition: OsTransition): OsStatus {
	return TRANSITIONS[transition].to;
}

export function transitionsFrom(from: OsStatus): OsTransition[] {
	return (Object.entries(TRANSITIONS) as [OsTransition, { from: OsStatus[]; to: OsStatus }][])
		.filter(([, def]) => def.from.includes(from))
		.map(([t]) => t);
}
