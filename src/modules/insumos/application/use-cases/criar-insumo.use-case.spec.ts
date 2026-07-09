import { CriarInsumoUseCase } from "./criar-insumo.use-case";

const gateway = { buscarPorCodigo: jest.fn(), criar: jest.fn() };

describe("CriarInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("409 quando código duplicado", async () => {
		gateway.buscarPorCodigo.mockResolvedValueOnce({ id: "x" });
		const r = await new CriarInsumoUseCase(gateway as any).execute({
			codigo: "P-001",
			nome: "Filtro",
			precoUnitario: 10,
		});
		expect(r.status).toBe(409);
	});

	it("201 persiste insumo novo com defaults de estoque", async () => {
		gateway.buscarPorCodigo.mockResolvedValueOnce(null);
		gateway.criar.mockResolvedValueOnce({ id: "novo" });
		const r = await new CriarInsumoUseCase(gateway as any).execute({
			codigo: "P-001",
			nome: "Filtro",
			precoUnitario: 10,
		});
		expect(r.status).toBe(201);
		expect(gateway.criar).toHaveBeenCalledWith(
			expect.objectContaining({ codigo: "P-001", nome: "Filtro", estoqueMinimo: 0, quantidadeEstoque: 0 }),
		);
	});
});
