import { HistoricoOsUseCase } from "./historico-os.use-case";

const gateway = { buscarPorId: jest.fn(), listarHistorico: jest.fn() };

describe("HistoricoOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 com histórico", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1" });
		gateway.listarHistorico.mockResolvedValue([{ statusNovo: "RECEBIDA" }]);
		const res = await new HistoricoOsUseCase(gateway as any).execute("os1");
		expect(res.status).toBe(200);
		expect(gateway.listarHistorico).toHaveBeenCalledWith("os1");
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		const res = await new HistoricoOsUseCase(gateway as any).execute("x");
		expect(res.status).toBe(404);
		expect(gateway.listarHistorico).not.toHaveBeenCalled();
	});
});
