import { BuscarServicoUseCase } from "./buscar-servico.use-case";

const gateway = { buscarPorId: jest.fn() };

describe("BuscarServicoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new BuscarServicoUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("200 quando existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1" });
		expect((await new BuscarServicoUseCase(gateway as any).execute("s1")).status).toBe(200);
	});
});
