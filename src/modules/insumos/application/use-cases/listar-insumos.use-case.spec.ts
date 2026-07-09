import { ListarInsumosUseCase } from "./listar-insumos.use-case";

const gateway = { listarTodos: jest.fn() };

describe("ListarInsumosUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 com a lista de insumos", async () => {
		gateway.listarTodos.mockResolvedValueOnce([{ id: "i1" }]);
		const r = await new ListarInsumosUseCase(gateway as any).execute();
		expect(r.status).toBe(200);
		expect(r.data?.length).toBe(1);
	});
});
