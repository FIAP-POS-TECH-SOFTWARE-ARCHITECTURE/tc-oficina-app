import { BuscarRegistroCompraUseCase } from "./buscar-registro-compra.use-case";

const gateway = { buscarDetalhePorId: jest.fn() };

describe("BuscarRegistroCompraUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValueOnce(null);
		expect((await new BuscarRegistroCompraUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("200 quando existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1" });
		expect((await new BuscarRegistroCompraUseCase(gateway as any).execute("rc1")).status).toBe(200);
	});
});
