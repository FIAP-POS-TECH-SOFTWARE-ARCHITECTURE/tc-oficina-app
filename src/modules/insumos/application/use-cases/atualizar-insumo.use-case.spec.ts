import { AtualizarInsumoUseCase } from "./atualizar-insumo.use-case";

const gateway = { buscarPorId: jest.fn(), atualizar: jest.fn() };

describe("AtualizarInsumoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new AtualizarInsumoUseCase(gateway as any).execute("x", { nome: "novo" })).status).toBe(404);
	});

	it("422 quando inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: false });
		expect((await new AtualizarInsumoUseCase(gateway as any).execute("i1", { nome: "novo" })).status).toBe(422);
	});

	it("200 atualiza", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true });
		gateway.atualizar.mockResolvedValueOnce({ id: "i1" });
		const r = await new AtualizarInsumoUseCase(gateway as any).execute("i1", { nome: "novo" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith("i1", { nome: "novo" });
	});
});
