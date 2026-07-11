import { OsStatus } from "../../domain/os-status";
import { RejeitarOrcamentoUseCase } from "./rejeitar-orcamento.use-case";

const gateway = {
	buscarPorNumero: jest.fn(),
	transicionarComHistorico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};
const notificador = { notificarMudancaStatus: jest.fn() };

const osMock = (overrides: any = {}) => ({
	id: "os1",
	numero: "OS-2026-000001",
	status: OsStatus.AGUARDANDO_APROVACAO,
	cliente: { nome: "Fulano", documento: "52998224725", email: null },
	...overrides,
});

function makeSut() {
	return new RejeitarOrcamentoUseCase(gateway as any, notificador);
}

describe("RejeitarOrcamentoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorNumero.mockResolvedValue(null);
		expect((await makeSut().execute("x", { documento: "52998224725" })).status).toBe(404);
	});

	it("403 documento errado", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		expect((await makeSut().execute("OS-2026-000001", { documento: "00000000000" })).status).toBe(403);
	});

	it("422 quando status inválido", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock({ status: OsStatus.EM_EXECUCAO }));
		expect((await makeSut().execute("OS-2026-000001", { documento: "52998224725" })).status).toBe(422);
	});

	it("200 cancela com canceladoEm e notifica", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		const res = await makeSut().execute("OS-2026-000001", { documento: "529.982.247-25" });
		expect(res.status).toBe(200);
		expect(gateway.transicionarComHistorico).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "os1",
				statusAnterior: OsStatus.AGUARDANDO_APROVACAO,
				statusNovo: OsStatus.CANCELADA,
				observacao: "Orçamento rejeitado pelo cliente",
				dadosExtras: expect.objectContaining({ canceladoEm: expect.any(Date) }),
			}),
		);
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(expect.objectContaining({ statusNovo: OsStatus.CANCELADA }));
	});
});
