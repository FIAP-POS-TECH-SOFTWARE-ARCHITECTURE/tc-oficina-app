import { ListarServicosUseCase } from "./listar-servicos.use-case";

const gateway = { listarTodos: jest.fn() };

describe("ListarServicosUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 com a lista de serviços", async () => {
		gateway.listarTodos.mockResolvedValueOnce([{ id: "s1" }]);
		const r = await new ListarServicosUseCase(gateway as any).execute();
		expect(r.status).toBe(200);
		expect(r.data).toEqual([{ id: "s1" }]);
	});
});
