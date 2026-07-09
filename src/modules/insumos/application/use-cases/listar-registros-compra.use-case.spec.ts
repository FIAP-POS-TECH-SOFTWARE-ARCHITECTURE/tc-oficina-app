import { ListarRegistrosCompraUseCase } from "./listar-registros-compra.use-case";

const gateway = { listarTodos: jest.fn() };

describe("ListarRegistrosCompraUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 devolve coleção", async () => {
		gateway.listarTodos.mockResolvedValueOnce([{ id: "rc1" }]);
		expect((await new ListarRegistrosCompraUseCase(gateway as any).execute()).status).toBe(200);
	});
});
