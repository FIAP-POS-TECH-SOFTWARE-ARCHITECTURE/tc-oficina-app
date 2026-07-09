import { CriarClienteUseCase } from "./criar-cliente.use-case";

const gateway = { buscarPorDocumento: jest.fn(), criar: jest.fn() };

describe("CriarClienteUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("409 quando documento já existe", async () => {
		gateway.buscarPorDocumento.mockResolvedValueOnce({ id: "x" });
		const r = await new CriarClienteUseCase(gateway as any).execute({
			nome: "X",
			documento: "529.982.247-25",
		});
		expect(r.status).toBe(409);
	});

	it("201 e tipoDocumento=CPF quando documento tem 11 dígitos", async () => {
		gateway.buscarPorDocumento.mockResolvedValueOnce(null);
		gateway.criar.mockResolvedValueOnce({ id: "1" });
		const r = await new CriarClienteUseCase(gateway as any).execute({
			nome: "X",
			documento: "529.982.247-25",
		});
		expect(r.status).toBe(201);
		expect(gateway.criar).toHaveBeenCalledWith(expect.objectContaining({ tipoDocumento: "CPF", documento: "52998224725" }));
	});

	it("201 e tipoDocumento=CNPJ quando documento tem 14 dígitos", async () => {
		gateway.buscarPorDocumento.mockResolvedValueOnce(null);
		gateway.criar.mockResolvedValueOnce({ id: "1" });
		const r = await new CriarClienteUseCase(gateway as any).execute({
			nome: "Empresa",
			documento: "11.444.777/0001-61",
		});
		expect(r.status).toBe(201);
		expect(gateway.criar).toHaveBeenCalledWith(expect.objectContaining({ tipoDocumento: "CNPJ" }));
	});
});
