import { ListarMovimentosInsumoUseCase } from "./listar-movimentos-insumo.use-case";

const gateway = { buscarPorId: jest.fn(), listarMovimentos: jest.fn() };

describe("ListarMovimentosInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando insumo não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new ListarMovimentosInsumoUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("200 com movimentos", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1" });
		gateway.listarMovimentos.mockResolvedValueOnce([]);
		expect((await new ListarMovimentosInsumoUseCase(gateway as any).execute("i1")).status).toBe(200);
	});
});
