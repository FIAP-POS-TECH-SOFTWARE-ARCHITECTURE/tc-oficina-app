import { AlertasEstoqueBaixoUseCase } from "./alertas-estoque-baixo.use-case";

const gateway = { listarEstoqueBaixo: jest.fn() };

describe("AlertasEstoqueBaixoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 com a lista de insumos abaixo do mínimo", async () => {
		gateway.listarEstoqueBaixo.mockResolvedValueOnce([{ id: "i1" }]);
		const r = await new AlertasEstoqueBaixoUseCase(gateway as any).execute();
		expect(r.status).toBe(200);
		expect(r.data?.length).toBe(1);
	});
});
