import { OsStatus } from "../../domain/os-status";
import { GerarOrcamentoUseCase } from "./gerar-orcamento.use-case";

const gateway = {
	buscarDetalhePorId: jest.fn(),
	calcularTotal: jest.fn(),
	transicionarComHistorico: jest.fn(),
};
const notificador = { notificarMudancaStatus: jest.fn() };

const osMock = (overrides: any = {}) => ({
	id: "os1",
	numero: "OS-2026-000001",
	status: OsStatus.EM_DIAGNOSTICO,
	cliente: { nome: "Fulano", email: null },
	itensServico: [{ subtotal: 100 }],
	itensInsumo: [],
	...overrides,
});

function makeSut() {
	return new GerarOrcamentoUseCase(gateway as any, notificador);
}

describe("GerarOrcamentoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando OS não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "u1")).status).toBe(404);
	});

	it("422 quando status inválido", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ status: OsStatus.RECEBIDA }));
		expect((await makeSut().execute("os1", "u1")).status).toBe(422);
	});

	it("422 sem serviços", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock({ itensServico: [] }));
		expect((await makeSut().execute("os1", "u1")).status).toBe(422);
	});

	it("200 calcula total, transita e notifica", async () => {
		gateway.buscarDetalhePorId
			.mockResolvedValueOnce(osMock())
			.mockResolvedValueOnce(osMock({ status: OsStatus.AGUARDANDO_APROVACAO }));
		gateway.calcularTotal.mockReturnValue(150);
		const res = await makeSut().execute("os1", "u1");
		expect(res.status).toBe(200);
		expect(gateway.transicionarComHistorico).toHaveBeenCalledWith({
			id: "os1",
			statusAnterior: OsStatus.EM_DIAGNOSTICO,
			statusNovo: OsStatus.AGUARDANDO_APROVACAO,
			usuarioId: "u1",
			observacao: "Orçamento gerado",
			dadosExtras: { valorTotal: 150 },
		});
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(
			expect.objectContaining({ statusNovo: OsStatus.AGUARDANDO_APROVACAO }),
		);
	});

	it("falha de notificação não falha a operação", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(osMock());
		gateway.calcularTotal.mockReturnValue(100);
		notificador.notificarMudancaStatus.mockRejectedValue(new Error("down"));
		expect((await makeSut().execute("os1", "u1")).status).toBe(200);
	});
});
