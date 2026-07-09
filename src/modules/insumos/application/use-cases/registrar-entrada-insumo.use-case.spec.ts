import { RegistrarEntradaInsumoUseCase } from "./registrar-entrada-insumo.use-case";

const gateway = { buscarPorId: jest.fn(), registrarEntrada: jest.fn() };

describe("RegistrarEntradaInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new RegistrarEntradaInsumoUseCase(gateway as any);

	it("404 quando insumo não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x", { quantidade: 1 }, "u1")).status).toBe(404);
	});

	it("422 quando insumo inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: false, quantidadeEstoque: 1 });
		expect((await useCase().execute("i1", { quantidade: 1 }, "u1")).status).toBe(422);
	});

	it("200 incrementa estoque e registra movimento de entrada", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true, quantidadeEstoque: 5 });
		gateway.registrarEntrada.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 8 });
		const r = await useCase().execute("i1", { quantidade: 3 }, "user-1");
		expect(r.status).toBe(200);
		expect(gateway.registrarEntrada).toHaveBeenCalledWith(
			expect.objectContaining({
				insumoId: "i1",
				quantidade: 3,
				quantidadeAnterior: 5,
				quantidadePosterior: 8,
				usuarioId: "user-1",
			}),
		);
	});
});
