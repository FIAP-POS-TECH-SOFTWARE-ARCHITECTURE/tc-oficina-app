import { OsStatus } from "../../domain/os-status";
import { RemoverItemServicoUseCase } from "./remover-item-servico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	buscarItemServico: jest.fn(),
	removerItemServico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};

function makeSut() {
	return new RemoverItemServicoUseCase(gateway as any);
}

describe("RemoverItemServicoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "it1")).status).toBe(404);
	});

	it("422 quando status não permite remover", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("404 quando item pertence a outra OS", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "OUTRA" });
		expect((await makeSut().execute("os1", "it1")).status).toBe(404);
		expect(gateway.removerItemServico).not.toHaveBeenCalled();
	});

	it("200 remove item", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1" });
		const res = await makeSut().execute("os1", "it1");
		expect(res.status).toBe(200);
		expect(gateway.removerItemServico).toHaveBeenCalledWith("it1");
	});
});
