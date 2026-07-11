import { BuscarVeiculoPorPlacaUseCase } from "./buscar-veiculo-por-placa.use-case";

const gateway = { buscarPorPlaca: jest.fn() };

describe("BuscarVeiculoPorPlacaUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("normaliza a placa e retorna 404 quando não acha", async () => {
		gateway.buscarPorPlaca.mockResolvedValueOnce(null);
		const r = await new BuscarVeiculoPorPlacaUseCase(gateway as any).execute("abc-1234");
		expect(r.status).toBe(404);
		expect(gateway.buscarPorPlaca).toHaveBeenCalledWith("ABC1234");
	});

	it("200 quando encontra", async () => {
		gateway.buscarPorPlaca.mockResolvedValueOnce({ id: "v1" });
		expect((await new BuscarVeiculoPorPlacaUseCase(gateway as any).execute("ABC1234")).status).toBe(200);
	});
});
