import { DomainError } from "./domain-error";
import { OrdemServico } from "./ordem-servico.entity";
import { OsStatus } from "./os-status";

describe("OrdemServico (entidade)", () => {
	const params = { numero: "OS-2026-000001", clienteId: "c1", veiculoId: "v1" };

	it("cria OS válida com status RECEBIDA", () => {
		const os = OrdemServico.criar(params);
		expect(os.status).toBe(OsStatus.RECEBIDA);
		expect(os.numero).toBe("OS-2026-000001");
		expect(os.clienteId).toBe("c1");
		expect(os.veiculoId).toBe("v1");
		expect(os.id).toBeNull();
	});

	it("não permite OS sem cliente", () => {
		expect(() => OrdemServico.criar({ ...params, clienteId: "" })).toThrow(DomainError);
	});

	it("não permite OS sem veículo", () => {
		expect(() => OrdemServico.criar({ ...params, veiculoId: "" })).toThrow(DomainError);
	});

	it("não permite número fora do padrão", () => {
		expect(() => OrdemServico.criar({ ...params, numero: "123" })).toThrow(DomainError);
	});

	it("reconstitui OS existente preservando status", () => {
		const os = OrdemServico.reconstituir({
			id: "os1",
			numero: "OS-2026-000001",
			clienteId: "c1",
			veiculoId: "v1",
			status: OsStatus.EM_EXECUCAO,
		});
		expect(os.id).toBe("os1");
		expect(os.status).toBe(OsStatus.EM_EXECUCAO);
	});

	it("transiciona status válido", () => {
		const os = OrdemServico.criar(params);
		expect(os.transicionar("iniciar_diagnostico")).toBe(OsStatus.EM_DIAGNOSTICO);
		expect(os.status).toBe(OsStatus.EM_DIAGNOSTICO);
	});

	it("rejeita transição inválida", () => {
		const os = OrdemServico.criar(params);
		expect(() => os.transicionar("finalizar")).toThrow(DomainError);
	});
});
