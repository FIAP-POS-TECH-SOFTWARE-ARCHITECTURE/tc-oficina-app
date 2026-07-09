import { BuscarVeiculoUseCase } from "./buscar-veiculo.use-case";

const gateway = { buscarPorId: jest.fn() };

describe("BuscarVeiculoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new BuscarVeiculoUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("200 quando existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "v1" });
		expect((await new BuscarVeiculoUseCase(gateway as any).execute("v1")).status).toBe(200);
	});
});
