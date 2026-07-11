import { InativarVeiculoUseCase } from "./inativar-veiculo.use-case";

const gateway = { buscarPorId: jest.fn(), contarOrdensAbertas: jest.fn(), inativar: jest.fn() };

describe("InativarVeiculoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando veículo não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new InativarVeiculoUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("422 quando já inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "v1", ativo: false });
		expect((await new InativarVeiculoUseCase(gateway as any).execute("v1")).status).toBe(422);
	});

	it("409 quando há ordens abertas", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "v1", ativo: true });
		gateway.contarOrdensAbertas.mockResolvedValueOnce(1);
		expect((await new InativarVeiculoUseCase(gateway as any).execute("v1")).status).toBe(409);
	});

	it("200 inativa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "v1", ativo: true });
		gateway.contarOrdensAbertas.mockResolvedValueOnce(0);
		gateway.inativar.mockResolvedValueOnce({ id: "v1", ativo: false });
		expect((await new InativarVeiculoUseCase(gateway as any).execute("v1")).status).toBe(200);
	});
});
