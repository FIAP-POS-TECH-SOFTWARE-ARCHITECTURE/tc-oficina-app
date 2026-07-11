import { OsStatus } from "../../domain/os-status";
import { EntregarOsUseCase } from "./entregar-os.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	transicionarComHistorico: jest.fn(),
	buscarDetalhePorId: jest.fn(),
};
const notificador = { notificarMudancaStatus: jest.fn() };

function makeSut() {
	return new EntregarOsUseCase(gateway as any, notificador);
}

describe("EntregarOsUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({
			id: "os1",
			numero: "OS-2026-000001",
			cliente: { nome: "Fulano", email: null },
		});
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "u1")).status).toBe(404);
	});

	it("422 quando não está FINALIZADA", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		expect((await makeSut().execute("os1", "u1")).status).toBe(422);
	});

	it("200 entrega com entregueEm e notifica", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.FINALIZADA });
		const res = await makeSut().execute("os1", "u1");
		expect(res.status).toBe(200);
		expect(gateway.transicionarComHistorico).toHaveBeenCalledWith(
			expect.objectContaining({
				statusAnterior: OsStatus.FINALIZADA,
				statusNovo: OsStatus.ENTREGUE,
				dadosExtras: expect.objectContaining({ entregueEm: expect.any(Date) }),
			}),
		);
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(expect.objectContaining({ statusNovo: OsStatus.ENTREGUE }));
	});

	it("falha de notificação não falha a operação", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.FINALIZADA });
		notificador.notificarMudancaStatus.mockRejectedValue(new Error("down"));
		expect((await makeSut().execute("os1", "u1")).status).toBe(200);
	});

	it("não notifica quando detalhe não é encontrado após transição", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.FINALIZADA });
		gateway.buscarDetalhePorId.mockResolvedValue(null);
		expect((await makeSut().execute("os1", "u1")).status).toBe(200);
		expect(notificador.notificarMudancaStatus).not.toHaveBeenCalled();
	});
});
