import { OsStatus } from "../../domain/os-status";
import { ConcluirItemServicoUseCase } from "./concluir-item-servico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	buscarItemServico: jest.fn(),
	concluirItemServico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};

function makeSut() {
	return new ConcluirItemServicoUseCase(gateway as any);
}

describe("ConcluirItemServicoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "it1")).status).toBe(404);
	});

	it("422 quando OS não está em execução", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.FINALIZADA });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("422 quando item não está em execução", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1", status: "PENDENTE" });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("200 conclui preservando iniciadoExecucaoEm do item", async () => {
		const inicio = new Date("2026-07-01T10:00:00Z");
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		gateway.buscarItemServico.mockResolvedValue({
			id: "it1",
			ordemServicoId: "os1",
			status: "EM_EXECUCAO",
			iniciadoExecucaoEm: inicio,
		});
		const res = await makeSut().execute("os1", "it1");
		expect(res.status).toBe(200);
		expect(gateway.concluirItemServico).toHaveBeenCalledWith(expect.objectContaining({ itemId: "it1", iniciadoExecucaoEm: inicio }));
	});

	it("usa agora como início quando item não tinha iniciadoExecucaoEm", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		gateway.buscarItemServico.mockResolvedValue({
			id: "it1",
			ordemServicoId: "os1",
			status: "EM_EXECUCAO",
			iniciadoExecucaoEm: null,
		});
		await makeSut().execute("os1", "it1");
		const arg = gateway.concluirItemServico.mock.calls[0][0];
		expect(arg.iniciadoExecucaoEm).toEqual(arg.finalizadoExecucaoEm);
	});
});
