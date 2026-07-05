import { TempoMedioServicosUseCase } from "./tempo-medio-servicos.use-case";

const gateway = { tempoMedioPorServico: jest.fn() };

describe("TempoMedioServicosUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("mapeia snake_case para camelCase", async () => {
		gateway.tempoMedioPorServico.mockResolvedValue([
			{ servico_id: "s1", nome: "Troca de óleo", ativo: true, tempo_medio_min: 42.5, total_execucoes: 3 },
		]);
		const res = await new TempoMedioServicosUseCase(gateway as any).execute("ativos");
		expect(res.status).toBe(200);
		expect(res.data).toEqual([{ servicoId: "s1", nome: "Troca de óleo", ativo: true, tempoMedioMin: 42.5, totalExecucoes: 3 }]);
	});

	it("usa filtro default 'ativos'", async () => {
		gateway.tempoMedioPorServico.mockResolvedValue([]);
		await new TempoMedioServicosUseCase(gateway as any).execute();
		expect(gateway.tempoMedioPorServico).toHaveBeenCalledWith("ativos");
	});
});
