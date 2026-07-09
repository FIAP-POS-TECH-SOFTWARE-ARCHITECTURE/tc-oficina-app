import { AtualizarClienteUseCase } from "./atualizar-cliente.use-case";

const gateway = { buscarPorId: jest.fn(), atualizar: jest.fn() };

describe("AtualizarClienteUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando cliente não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new AtualizarClienteUseCase(gateway as any).execute("x", { nome: "y" })).status).toBe(404);
	});

	it("422 quando cliente está inativado", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: false });
		expect((await new AtualizarClienteUseCase(gateway as any).execute("1", { nome: "y" })).status).toBe(422);
	});

	it("200 atualiza", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: true });
		gateway.atualizar.mockResolvedValueOnce({ id: "1" });
		const r = await new AtualizarClienteUseCase(gateway as any).execute("1", { nome: "y" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith("1", { nome: "y" });
	});
});
