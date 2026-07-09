import { BuscarClientePorDocumentoUseCase } from "./buscar-cliente-por-documento.use-case";

const gateway = { buscarPorDocumento: jest.fn() };

describe("BuscarClientePorDocumentoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("normaliza o documento e retorna 404 quando não acha", async () => {
		gateway.buscarPorDocumento.mockResolvedValueOnce(null);
		const r = await new BuscarClientePorDocumentoUseCase(gateway as any).execute("529.982.247-25");
		expect(r.status).toBe(404);
		expect(gateway.buscarPorDocumento).toHaveBeenCalledWith("52998224725");
	});

	it("200 quando encontra", async () => {
		gateway.buscarPorDocumento.mockResolvedValueOnce({ id: "1" });
		expect((await new BuscarClientePorDocumentoUseCase(gateway as any).execute("52998224725")).status).toBe(200);
	});
});
