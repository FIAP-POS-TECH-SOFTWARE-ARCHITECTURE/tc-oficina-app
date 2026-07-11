import { OsStatus } from "../../domain/os-status";
import { IniciarItemServicoUseCase } from "./iniciar-item-servico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	buscarItemServico: jest.fn(),
	iniciarItemServico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};

function makeSut() {
	return new IniciarItemServicoUseCase(gateway as any);
}

describe("IniciarItemServicoUseCase", () => {
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

	it("422 quando item não está pendente", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO, iniciadoExecucaoEm: new Date() });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1", status: "EM_EXECUCAO" });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("200 inicia item e marca início da OS quando ainda não iniciada", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO, iniciadoExecucaoEm: null });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1", status: "PENDENTE" });
		const res = await makeSut().execute("os1", "it1");
		expect(res.status).toBe(200);
		expect(gateway.iniciarItemServico).toHaveBeenCalledWith(
			expect.objectContaining({ osId: "os1", itemId: "it1", marcarInicioOs: true }),
		);
	});

	it("não marca início da OS quando já iniciada", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO, iniciadoExecucaoEm: new Date() });
		gateway.buscarItemServico.mockResolvedValue({ id: "it1", ordemServicoId: "os1", status: "PENDENTE" });
		await makeSut().execute("os1", "it1");
		expect(gateway.iniciarItemServico).toHaveBeenCalledWith(expect.objectContaining({ marcarInicioOs: false }));
	});
});
