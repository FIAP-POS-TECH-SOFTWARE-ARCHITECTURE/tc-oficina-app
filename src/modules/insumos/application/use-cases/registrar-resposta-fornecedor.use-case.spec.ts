import { RegistrarRespostaFornecedorUseCase } from "./registrar-resposta-fornecedor.use-case";

const gateway = { buscarPorId: jest.fn(), buscarDetalhePorId: jest.fn(), atualizar: jest.fn() };

describe("RegistrarRespostaFornecedorUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new RegistrarRespostaFornecedorUseCase(gateway as any);

	it("404 quando registro não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x", { aprovado: true })).status).toBe(404);
	});

	it("422 quando status não é CRIADO", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "RECEBIDO" });
		expect((await useCase().execute("rc1", { aprovado: false })).status).toBe(422);
	});

	it("400 ao recusar sem motivo nem mensagem", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "CRIADO" });
		expect((await useCase().execute("rc1", { aprovado: false })).status).toBe(400);
	});

	it("200 aprovando", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "CRIADO" });
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1" });
		const r = await useCase().execute("rc1", { aprovado: true, codigo: "X", mensagem: "ok" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith("rc1", expect.objectContaining({ status: "APROVADO_FORNECEDOR" }));
	});

	it("200 recusando com motivoRecusa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "CRIADO" });
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1" });
		const r = await useCase().execute("rc1", { aprovado: false, motivoRecusa: "sem estoque" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: "RECUSADO_FORNECEDOR", motivoRecusa: "sem estoque" }),
		);
	});

	it("200 recusando com mensagem como fallback de motivoRecusa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "CRIADO" });
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1" });
		const r = await useCase().execute("rc1", { aprovado: false, mensagem: "mensagem como motivo" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith("rc1", expect.objectContaining({ motivoRecusa: "mensagem como motivo" }));
	});
});
