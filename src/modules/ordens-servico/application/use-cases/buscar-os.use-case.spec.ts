import { BuscarOsUseCase } from "./buscar-os.use-case";

const gateway = { buscarDetalhePorId: jest.fn() };

describe("BuscarOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 com detalhe quando existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
		const res = await new BuscarOsUseCase(gateway as any).execute("os1");
		expect(res.status).toBe(200);
	});

	it("404 quando não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValue(null);
		const res = await new BuscarOsUseCase(gateway as any).execute("x");
		expect(res.status).toBe(404);
	});
});
