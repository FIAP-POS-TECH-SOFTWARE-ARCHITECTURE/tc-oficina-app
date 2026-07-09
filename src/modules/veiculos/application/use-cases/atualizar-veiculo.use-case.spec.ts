import { AtualizarVeiculoUseCase } from "./atualizar-veiculo.use-case";

const gateway = { buscarPorId: jest.fn(), atualizar: jest.fn() };

describe("AtualizarVeiculoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando veículo não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new AtualizarVeiculoUseCase(gateway as any).execute("x", {})).status).toBe(404);
	});

	it("422 quando veículo inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "v1", ativo: false });
		expect((await new AtualizarVeiculoUseCase(gateway as any).execute("v1", { marca: "X" })).status).toBe(422);
	});

	it("200 atualiza", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "v1", ativo: true });
		gateway.atualizar.mockResolvedValueOnce({ id: "v1" });
		const r = await new AtualizarVeiculoUseCase(gateway as any).execute("v1", { marca: "X" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith("v1", { marca: "X" });
	});
});
