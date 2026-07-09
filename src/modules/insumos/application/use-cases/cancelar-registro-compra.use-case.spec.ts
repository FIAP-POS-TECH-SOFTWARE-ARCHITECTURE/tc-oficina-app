import { CancelarRegistroCompraUseCase } from "./cancelar-registro-compra.use-case";

const gateway = { buscarPorId: jest.fn(), buscarDetalhePorId: jest.fn(), atualizar: jest.fn() };

describe("CancelarRegistroCompraUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new CancelarRegistroCompraUseCase(gateway as any);

	it("404 quando não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x", { motivo: "y" })).status).toBe(404);
	});

	it("422 quando já recebido", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "RECEBIDO" });
		expect((await useCase().execute("rc1", { motivo: "sem necessidade" })).status).toBe(422);
	});

	it("422 quando já cancelado", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "CANCELADO" });
		expect((await useCase().execute("rc1", { motivo: "y" })).status).toBe(422);
	});

	it("200 quando aprovado pelo fornecedor", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "APROVADO_FORNECEDOR" });
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1", status: "CANCELADO" });
		const r = await useCase().execute("rc1", { motivo: "desistência" });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: "CANCELADO", motivoCancelamento: "desistência" }),
		);
	});
});
