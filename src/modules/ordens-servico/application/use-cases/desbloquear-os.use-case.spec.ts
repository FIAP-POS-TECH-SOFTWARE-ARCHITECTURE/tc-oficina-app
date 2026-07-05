import { OsStatus } from "../../domain/os-status";
import { DesbloquearOsUseCase } from "./desbloquear-os.use-case";

const gateway = {
	buscarDetalhePorId: jest.fn(),
	executarDesbloqueio: jest.fn(),
};
const notificador = { notificarMudancaStatus: jest.fn() };

const osMock = (overrides: any = {}) => ({
	id: "os1",
	numero: "OS-2026-000001",
	status: OsStatus.BLOQUEADA,
	cliente: { nome: "Fulano", email: null },
	itensInsumo: [],
	...overrides,
});

function makeSut() {
	return new DesbloquearOsUseCase(gateway as any, notificador);
}

describe("DesbloquearOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando OS não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "u1", {})).status).toBe(404);
	});

	it("422 quando OS não está bloqueada", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ status: OsStatus.EM_EXECUCAO }));
		expect((await makeSut().execute("os1", "u1", {})).status).toBe(422);
		expect(gateway.executarDesbloqueio).not.toHaveBeenCalled();
	});

	it("422 quando segue sem estoque", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock());
		gateway.executarDesbloqueio.mockResolvedValue({ faltantes: ["Filtro (1 disponível, 5 requisitados)"] });
		const res = await makeSut().execute("os1", "u1", {});
		expect(res.status).toBe(422);
		expect(notificador.notificarMudancaStatus).not.toHaveBeenCalled();
	});

	it("200 desbloqueia e notifica", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock());
		gateway.executarDesbloqueio.mockResolvedValue({ faltantes: [] });
		const res = await makeSut().execute("os1", "u1", { observacao: "ok" });
		expect(res.status).toBe(200);
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(
			expect.objectContaining({ statusAnterior: OsStatus.BLOQUEADA, statusNovo: OsStatus.EM_EXECUCAO }),
		);
	});
});
