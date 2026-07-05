import { OsStatus } from "../../domain/os-status";
import { IniciarDiagnosticoUseCase } from "./iniciar-diagnostico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	transicionarComHistorico: jest.fn(),
	buscarDetalhePorId: jest.fn(),
};
const notificador = { notificarMudancaStatus: jest.fn() };

function makeSut() {
	return new IniciarDiagnosticoUseCase(gateway as any, notificador);
}

describe("IniciarDiagnosticoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({
			id: "os1",
			numero: "OS-2026-000001",
			cliente: { nome: "Fulano", email: "f@x.com" },
		});
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		const res = await makeSut().execute("x", "u1");
		expect(res.status).toBe(404);
	});

	it("422 quando transição inválida", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		const res = await makeSut().execute("os1", "u1");
		expect(res.status).toBe(422);
		expect(gateway.transicionarComHistorico).not.toHaveBeenCalled();
	});

	it("200 transiciona para EM_DIAGNOSTICO e notifica", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		const res = await makeSut().execute("os1", "u1");
		expect(res.status).toBe(200);
		expect(gateway.transicionarComHistorico).toHaveBeenCalledWith({
			id: "os1",
			statusAnterior: OsStatus.RECEBIDA,
			statusNovo: OsStatus.EM_DIAGNOSTICO,
			usuarioId: "u1",
		});
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(
			expect.objectContaining({
				numeroOs: "OS-2026-000001",
				statusAnterior: OsStatus.RECEBIDA,
				statusNovo: OsStatus.EM_DIAGNOSTICO,
			}),
		);
	});

	it("falha de notificação não falha a operação", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		notificador.notificarMudancaStatus.mockRejectedValue(new Error("smtp down"));
		const res = await makeSut().execute("os1", "u1");
		expect(res.status).toBe(200);
	});
});
