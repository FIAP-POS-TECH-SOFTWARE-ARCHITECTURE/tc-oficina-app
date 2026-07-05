import { ConsultaPublicaOsUseCase } from "./consulta-publica-os.use-case";

const gateway = { buscarPorNumero: jest.fn() };

const osMock = () => ({
	numero: "OS-2026-000001",
	status: "AGUARDANDO_APROVACAO",
	diagnostico: "diag",
	valorTotal: 100,
	cliente: { nome: "Fulano de Tal", documento: "52998224725", email: null },
	veiculo: { placa: "ABC1234", marca: "Fiat", modelo: "Uno" },
	itensServico: [
		{
			servico: { nome: "Troca de óleo" },
			status: "PENDENTE",
			iniciadoExecucaoEm: null,
			finalizadoExecucaoEm: null,
			quantidade: 1,
			precoUnitario: 100,
			subtotal: 100,
		},
	],
	itensInsumo: [{ insumo: { nome: "Óleo" }, quantidade: 1, precoUnitario: 50, subtotal: 50 }],
	historico: [{ statusAnterior: null, statusNovo: "RECEBIDA", observacao: null, createdAt: new Date() }],
});

function makeSut() {
	return new ConsultaPublicaOsUseCase(gateway as any);
}

describe("ConsultaPublicaOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando número não existe", async () => {
		gateway.buscarPorNumero.mockResolvedValue(null);
		const res = await makeSut().execute("OS-2026-000001", "52998224725");
		expect(res.status).toBe(404);
	});

	it("403 quando documento não confere", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		const res = await makeSut().execute("OS-2026-000001", "00000000000");
		expect(res.status).toBe(403);
	});

	it("200 mascara nome e mapeia itens/histórico", async () => {
		gateway.buscarPorNumero.mockResolvedValue(osMock());
		const res = await makeSut().execute("OS-2026-000001", "529.982.247-25");
		expect(res.status).toBe(200);
		const data = res.data as any;
		expect(data.cliente).toBe("Fulano d* Tal");
		expect(data.itensServico[0]).toMatchObject({ nome: "Troca de óleo", status: "PENDENTE" });
		expect(data.itensInsumo[0]).toMatchObject({ nome: "Óleo" });
		expect(data.historico[0]).toHaveProperty("em");
	});

	it("mascara nome único preservando primeira letra", async () => {
		const os = osMock();
		os.cliente.nome = "Fulano";
		gateway.buscarPorNumero.mockResolvedValue(os);
		const res = await makeSut().execute("OS-2026-000001", "52998224725");
		expect((res.data as any).cliente).toBe("F*****");
	});

	it("mascara nome composto de duas partes", async () => {
		const os = osMock();
		os.cliente.nome = "Fulano Tal";
		gateway.buscarPorNumero.mockResolvedValue(os);
		const res = await makeSut().execute("OS-2026-000001", "52998224725");
		expect((res.data as any).cliente).toBe("Fulano T**");
	});
});
