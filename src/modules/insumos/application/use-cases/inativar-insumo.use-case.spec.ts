import { InativarInsumoUseCase } from "./inativar-insumo.use-case";

const gateway = { buscarPorId: jest.fn(), inativar: jest.fn() };

describe("InativarInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new InativarInsumoUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("422 quando já inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: false });
		expect((await new InativarInsumoUseCase(gateway as any).execute("i1")).status).toBe(422);
	});

	it("200 inativa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true });
		gateway.inativar.mockResolvedValueOnce({ id: "i1", ativo: false });
		expect((await new InativarInsumoUseCase(gateway as any).execute("i1")).status).toBe(200);
	});
});
