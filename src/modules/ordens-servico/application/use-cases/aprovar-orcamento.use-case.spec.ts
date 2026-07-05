import { OsStatus } from "../../domain/os-status";
import { AprovarOrcamentoUseCase } from "./aprovar-orcamento.use-case";

const gateway = {
	buscarPorNumero: jest.fn(),
	executarAprovacao: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};
const notificador = { notificarMudancaStatus: jest.fn() };

const osMock = (overrides: any = {}) => ({
	id: "os1",
	numero: "OS-2026-000001",
	status: OsStatus.AGUARDANDO_APROVACAO,
	cliente: { nome: "Fulano", documento: "52998224725", email: null },
	itensInsumo: [],
	...overrides,
});

function makeSut() {
	return new AprovarOrcamentoUseCase(gateway as any, notificador);
}

describe("AprovarOrcamentoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorNumero.mockResolvedValue(null);
		expect((await makeSut().execute("x", { documento: "52998224725" })).status).toBe(404);
	});

	it("403 quando documento não confere", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		expect((await makeSut().execute("OS-2026-000001", { documento: "11111111111" })).status).toBe(403);
		expect(gateway.executarAprovacao).not.toHaveBeenCalled();
	});

	it("422 quando status inválido", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock({ status: OsStatus.EM_EXECUCAO }));
		expect((await makeSut().execute("OS-2026-000001", { documento: "52998224725" })).status).toBe(422);
	});

	it("200 aprova, executa aprovação e notifica EM_EXECUCAO", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		gateway.executarAprovacao.mockResolvedValue({ bloqueadaPorFaltaEstoque: false, faltantes: [] });
		const res = await makeSut().execute("OS-2026-000001", { documento: "529.982.247-25" });
		expect(res.status).toBe(200);
		expect(res.message).toBe("Orçamento aprovado");
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(expect.objectContaining({ statusNovo: OsStatus.EM_EXECUCAO }));
	});

	it("200 com mensagem de bloqueio quando falta estoque e notifica BLOQUEADA", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		gateway.executarAprovacao.mockResolvedValue({ bloqueadaPorFaltaEstoque: true, faltantes: ["Filtro"] });
		const res = await makeSut().execute("OS-2026-000001", { documento: "52998224725" });
		expect(res.status).toBe(200);
		expect(res.message).toContain("bloqueada");
		expect(notificador.notificarMudancaStatus).toHaveBeenCalledWith(expect.objectContaining({ statusNovo: OsStatus.BLOQUEADA }));
	});

	it("falha de notificação não falha a operação", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		gateway.executarAprovacao.mockResolvedValue({ bloqueadaPorFaltaEstoque: false, faltantes: [] });
		notificador.notificarMudancaStatus.mockRejectedValue(new Error("down"));
		expect((await makeSut().execute("OS-2026-000001", { documento: "52998224725" })).status).toBe(200);
	});
});
