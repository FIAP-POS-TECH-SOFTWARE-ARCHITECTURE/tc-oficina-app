import { InativarClienteUseCase } from "./inativar-cliente.use-case";

const gateway = { buscarPorId: jest.fn(), contarOrdensAbertas: jest.fn(), inativar: jest.fn() };

describe("InativarClienteUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando cliente não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new InativarClienteUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("422 quando cliente já está inativado", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: false });
		expect((await new InativarClienteUseCase(gateway as any).execute("1")).status).toBe(422);
	});

	it("409 quando há ordens abertas", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: true });
		gateway.contarOrdensAbertas.mockResolvedValueOnce(2);
		expect((await new InativarClienteUseCase(gateway as any).execute("1")).status).toBe(409);
	});

	it("200 inativa quando não há ordens abertas", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: true });
		gateway.contarOrdensAbertas.mockResolvedValueOnce(0);
		gateway.inativar.mockResolvedValueOnce({ id: "1", ativo: false });
		expect((await new InativarClienteUseCase(gateway as any).execute("1")).status).toBe(200);
	});
});
