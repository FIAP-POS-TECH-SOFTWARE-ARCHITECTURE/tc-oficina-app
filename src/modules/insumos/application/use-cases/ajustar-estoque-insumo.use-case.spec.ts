import { AjustarEstoqueInsumoUseCase } from "./ajustar-estoque-insumo.use-case";

const gateway = { buscarPorId: jest.fn(), registrarAjuste: jest.fn() };

describe("AjustarEstoqueInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new AjustarEstoqueInsumoUseCase(gateway as any);

	it("404 quando insumo não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x", { novaQuantidade: 1, motivo: "x" }, "u1")).status).toBe(404);
	});

	it("422 quando insumo inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: false, quantidadeEstoque: 1 });
		expect((await useCase().execute("i1", { novaQuantidade: 1, motivo: "x" }, "u1")).status).toBe(422);
	});

	it("400 quando nova quantidade é negativa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true, quantidadeEstoque: 5 });
		expect((await useCase().execute("i1", { novaQuantidade: -1, motivo: "erro" }, "u1")).status).toBe(400);
	});

	it("200 com delta positivo registra ajuste com quantidade absoluta", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true, quantidadeEstoque: 5 });
		gateway.registrarAjuste.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 8 });
		const r = await useCase().execute("i1", { novaQuantidade: 8, motivo: "contagem" }, "u1");
		expect(r.status).toBe(200);
		expect(gateway.registrarAjuste).toHaveBeenCalledWith(
			expect.objectContaining({ quantidade: 3, quantidadeAnterior: 5, quantidadePosterior: 8 }),
		);
	});

	it("200 com delta negativo registra ajuste com quantidade absoluta", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true, quantidadeEstoque: 5 });
		gateway.registrarAjuste.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 2 });
		const r = await useCase().execute("i1", { novaQuantidade: 2, motivo: "perda" }, "u1");
		expect(r.status).toBe(200);
		expect(gateway.registrarAjuste).toHaveBeenCalledWith(
			expect.objectContaining({ quantidade: 3, quantidadeAnterior: 5, quantidadePosterior: 2 }),
		);
	});
});
