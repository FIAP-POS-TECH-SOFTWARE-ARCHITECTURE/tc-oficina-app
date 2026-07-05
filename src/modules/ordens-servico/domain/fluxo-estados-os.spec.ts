import { canTransition, nextStatus, OsTransition, transitionsFrom } from "./fluxo-estados-os";
import { OsStatus } from "./os-status";

describe("Fluxo de estados da OS (domínio)", () => {
	const todasTransicoes: OsTransition[] = [
		"iniciar_diagnostico",
		"gerar_orcamento",
		"aprovar_orcamento",
		"desbloquear",
		"rejeitar_orcamento",
		"finalizar",
		"entregar",
		"cancelar",
	];

	const todosStatus = Object.values(OsStatus) as OsStatus[];

	const validas: { from: OsStatus; transition: OsTransition; to: OsStatus }[] = [
		{ from: OsStatus.RECEBIDA, transition: "iniciar_diagnostico", to: OsStatus.EM_DIAGNOSTICO },
		{ from: OsStatus.EM_DIAGNOSTICO, transition: "gerar_orcamento", to: OsStatus.AGUARDANDO_APROVACAO },
		{ from: OsStatus.AGUARDANDO_APROVACAO, transition: "aprovar_orcamento", to: OsStatus.EM_EXECUCAO },
		{ from: OsStatus.BLOQUEADA, transition: "desbloquear", to: OsStatus.EM_EXECUCAO },
		{ from: OsStatus.AGUARDANDO_APROVACAO, transition: "rejeitar_orcamento", to: OsStatus.CANCELADA },
		{ from: OsStatus.EM_EXECUCAO, transition: "finalizar", to: OsStatus.FINALIZADA },
		{ from: OsStatus.FINALIZADA, transition: "entregar", to: OsStatus.ENTREGUE },
		{ from: OsStatus.RECEBIDA, transition: "cancelar", to: OsStatus.CANCELADA },
		{ from: OsStatus.EM_DIAGNOSTICO, transition: "cancelar", to: OsStatus.CANCELADA },
		{ from: OsStatus.AGUARDANDO_APROVACAO, transition: "cancelar", to: OsStatus.CANCELADA },
		{ from: OsStatus.BLOQUEADA, transition: "cancelar", to: OsStatus.CANCELADA },
		{ from: OsStatus.EM_EXECUCAO, transition: "cancelar", to: OsStatus.CANCELADA },
		{ from: OsStatus.FINALIZADA, transition: "cancelar", to: OsStatus.CANCELADA },
	];

	it.each(validas)("aceita $transition a partir de $from -> $to", ({ from, transition, to }) => {
		expect(canTransition(from, transition)).toBe(true);
		expect(nextStatus(transition)).toBe(to);
	});

	it("rejeita transições inválidas para todos os pares restantes", () => {
		const validasSet = new Set(validas.map((v) => `${v.from}|${v.transition}`));
		for (const from of todosStatus) {
			for (const transition of todasTransicoes) {
				if (validasSet.has(`${from}|${transition}`)) continue;
				expect(canTransition(from, transition)).toBe(false);
			}
		}
	});

	it("não permite cancelar OS já entregue", () => {
		expect(canTransition(OsStatus.ENTREGUE, "cancelar")).toBe(false);
	});

	it("não permite entregar antes de finalizar", () => {
		expect(canTransition(OsStatus.EM_EXECUCAO, "entregar")).toBe(false);
	});

	describe("transitionsFrom", () => {
		it("retorna lista de transições disponíveis a partir de RECEBIDA", () => {
			const transitions = transitionsFrom(OsStatus.RECEBIDA);
			expect(transitions).toContain("iniciar_diagnostico");
			expect(transitions).toContain("cancelar");
			expect(transitions).not.toContain("finalizar");
		});

		it("retorna lista de transições disponíveis a partir de EM_EXECUCAO", () => {
			const transitions = transitionsFrom(OsStatus.EM_EXECUCAO);
			expect(transitions).toContain("finalizar");
			expect(transitions).toContain("cancelar");
			expect(transitions).not.toContain("iniciar_diagnostico");
		});

		it("retorna lista vazia para status sem transições disponíveis (ENTREGUE)", () => {
			const transitions = transitionsFrom(OsStatus.ENTREGUE);
			expect(transitions).toHaveLength(0);
		});
	});
});
