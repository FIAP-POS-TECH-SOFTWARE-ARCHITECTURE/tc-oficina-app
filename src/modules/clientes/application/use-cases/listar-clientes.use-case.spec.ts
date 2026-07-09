import { ListarClientesUseCase } from "./listar-clientes.use-case";

const gateway = { listarTodos: jest.fn() };

describe("ListarClientesUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 com a lista de clientes", async () => {
		gateway.listarTodos.mockResolvedValueOnce([{ id: "1" }]);
		const r = await new ListarClientesUseCase(gateway as any).execute();
		expect(r.status).toBe(200);
		expect(r.data).toEqual([{ id: "1" }]);
	});
});
