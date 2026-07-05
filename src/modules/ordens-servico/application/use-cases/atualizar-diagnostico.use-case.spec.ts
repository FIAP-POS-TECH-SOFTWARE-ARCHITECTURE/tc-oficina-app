import { OsStatus } from "../../domain/os-status";
import { AtualizarDiagnosticoUseCase } from "./atualizar-diagnostico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	atualizarDiagnostico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};

function makeSut() {
	return new AtualizarDiagnosticoUseCase(gateway as any);
}

describe("AtualizarDiagnosticoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		const res = await makeSut().execute("x", { diagnostico: "d" });
		expect(res.status).toBe(404);
	});

	it("422 quando OS não está em diagnóstico", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		const res = await makeSut().execute("os1", { diagnostico: "d" });
		expect(res.status).toBe(422);
		expect(gateway.atualizarDiagnostico).not.toHaveBeenCalled();
	});

	it("200 atualiza diagnóstico", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		const res = await makeSut().execute("os1", { diagnostico: "motor batendo" });
		expect(res.status).toBe(200);
		expect(gateway.atualizarDiagnostico).toHaveBeenCalledWith("os1", "motor batendo");
	});
});
