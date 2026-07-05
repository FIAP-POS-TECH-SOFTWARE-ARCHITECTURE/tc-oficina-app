import { OsStatus } from "../../domain/os-status";
import { FinalizarOsUseCase } from "./finalizar-os.use-case";

const gateway = {
	buscarDetalhePorId: jest.fn(),
	transicionarComHistorico: jest.fn(),
};
const notificador = { notificarMudancaStatus: jest.fn() };

const osMock = (overrides: any = {}) => ({
	id: "os1",
	numero: "OS-2026-000001",
	status: OsStatus.EM_EXECUCAO,
	cliente: { nome: "Fulano", email: null },
	itensServico: [{ status: "CONCLUIDO" }, { status: "CANCELADO" }],
	...overrides,
});

function makeSut() {
	return new FinalizarOsUseCase(gateway as any, notificador);
}

describe("FinalizarOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando OS não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "u1")).status).toBe(404);
	});

	it("422 transição inválida", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ status: OsStatus.RECEBIDA }));
		expect((await makeSut().execute("os1", "u1")).status).toBe(422);
	});

	it("422 sem itensServico", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ itensServico: [] }));
		expect((await makeSut().execute("os1", "u1")).status).toBe(422);
	});

	it("422 com serviço pendente", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ itensServico: [{ status: "PENDENTE" }] }));
		expect((await makeSut().execute("os1", "u1")).status).toBe(422);
	});

	it("200 finaliza com finalizadoEm e notifica", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock());
		const res = await makeSut().execute("os1", "u1");
		expect(res.status).toBe(200);
		expect(gateway.transicionarComHistorico).toHaveBeenCalledWith(
			expect.objectContaining({
				statusAnterior: OsStatus.EM_EXECUCAO,
				statusNovo: OsStatus.FINALIZADA,
				usuarioId: "u1",
				dadosExtras: expect.objectContaining({ finalizadoEm: expect.any(Date) }),
			}),
		);
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(expect.objectContaining({ statusNovo: OsStatus.FINALIZADA }));
	});
});
