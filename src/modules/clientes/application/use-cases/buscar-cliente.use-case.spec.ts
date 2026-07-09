import { BuscarClienteUseCase } from "./buscar-cliente.use-case";

const gateway = { buscarPorId: jest.fn() };

describe("BuscarClienteUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new BuscarClienteUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("200 quando existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1" });
		expect((await new BuscarClienteUseCase(gateway as any).execute("1")).status).toBe(200);
	});
});
