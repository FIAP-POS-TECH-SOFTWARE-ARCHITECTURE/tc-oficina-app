import { BuscarInsumoUseCase } from "./buscar-insumo.use-case";

const gateway = { buscarPorId: jest.fn() };

describe("BuscarInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não encontra", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new BuscarInsumoUseCase(gateway as any).execute("nope")).status).toBe(404);
	});

	it("200 quando encontra", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1" });
		expect((await new BuscarInsumoUseCase(gateway as any).execute("i1")).status).toBe(200);
	});
});
