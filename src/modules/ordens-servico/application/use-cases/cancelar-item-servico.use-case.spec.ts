import { OsStatus } from "../../domain/os-status";
import { CancelarItemServicoUseCase } from "./cancelar-item-servico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	buscarItemServico: jest.fn(),
	cancelarItemServico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};

function makeSut() {
	return new CancelarItemServicoUseCase(gateway as any);
}

describe("CancelarItemServicoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "it1")).status).toBe(404);
	});

	it("422 quando OS não está em execução", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("422 quando item já concluído", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1", status: "CONCLUIDO" });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("200 cancela item pendente", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1", status: "PENDENTE" });
		const res = await makeSut().execute("os1", "it1");
		expect(res.status).toBe(200);
		expect(gateway.cancelarItemServico).toHaveBeenCalledWith("it1");
	});
});
