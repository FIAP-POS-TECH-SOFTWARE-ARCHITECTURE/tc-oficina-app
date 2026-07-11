import { OsStatus } from "../../domain/os-status";
import { CancelarOsUseCase } from "./cancelar-os.use-case";

const gateway = {
	buscarDetalhePorId: jest.fn(),
	executarCancelamento: jest.fn(),
};
const notificador = { notificarMudancaStatus: jest.fn() };

const osMock = (overrides: any = {}) => ({
	id: "os1",
	numero: "OS-2026-000001",
	status: OsStatus.EM_EXECUCAO,
	aprovadoEm: new Date(),
	cliente: { nome: "Fulano", email: null },
	itensInsumo: [],
	...overrides,
});

function makeSut() {
	return new CancelarOsUseCase(gateway as any, notificador);
}

describe("CancelarOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando OS não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "u1", {})).status).toBe(404);
	});

	it("422 quando status não permite cancelar (ENTREGUE)", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ status: OsStatus.ENTREGUE }));
		expect((await makeSut().execute("os1", "u1", {})).status).toBe(422);
	});

	it("cancela com estorno quando aprovada e não bloqueada", async () => {
		const os = osMock();
		gateway.buscarDetalhePorId.mockResolvedValue(os);
		const res = await makeSut().execute("os1", "u1", { motivo: "x" });
		expect(res.status).toBe(200);
		expect(gateway.executarCancelamento).toHaveBeenCalledWith(os, "u1", "x", true);
	});

	it("cancela sem estorno quando não aprovada", async () => {
		const os = osMock({ aprovadoEm: null, status: OsStatus.RECEBIDA });
		gateway.buscarDetalhePorId.mockResolvedValue(os);
		await makeSut().execute("os1", "u1", {});
		expect(gateway.executarCancelamento).toHaveBeenCalledWith(os, "u1", undefined, false);
	});

	it("cancela sem estorno quando bloqueada", async () => {
		const os = osMock({ status: OsStatus.BLOQUEADA });
		gateway.buscarDetalhePorId.mockResolvedValue(os);
		await makeSut().execute("os1", "u1", {});
		expect(gateway.executarCancelamento).toHaveBeenCalledWith(os, "u1", undefined, false);
	});

	it("notifica CANCELADA", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock());
		await makeSut().execute("os1", "u1", { motivo: "cliente desistiu" });
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(
			expect.objectContaining({ statusNovo: OsStatus.CANCELADA, observacao: "cliente desistiu" }),
		);
	});
});
