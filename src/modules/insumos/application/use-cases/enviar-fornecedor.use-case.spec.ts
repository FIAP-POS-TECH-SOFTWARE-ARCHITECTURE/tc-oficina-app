import { EnviarFornecedorUseCase } from "./enviar-fornecedor.use-case";

const gateway = { buscarDetalhePorId: jest.fn(), atualizar: jest.fn() };
const fornecedor = { enviarCompra: jest.fn() };

describe("EnviarFornecedorUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new EnviarFornecedorUseCase(gateway as any, fornecedor as any);

	it("404 quando registro não existe", async () => {
		gateway.buscarDetalhePorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x")).status).toBe(404);
	});

	it("422 quando status não é CRIADO", async () => {
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1", status: "APROVADO_FORNECEDOR" });
		expect((await useCase().execute("rc1")).status).toBe(422);
	});

	it("registra aprovação do stub", async () => {
		gateway.buscarDetalhePorId
			.mockResolvedValueOnce({ id: "rc1", status: "CRIADO", quantidadeSolicitada: 2, insumo: { codigo: "P-001" } })
			.mockResolvedValueOnce({ id: "rc1", status: "APROVADO_FORNECEDOR" });
		fornecedor.enviarCompra.mockReturnValueOnce({ aprovado: true, codigo: "APROVADO_STUB", mensagem: "ok", payload: {} });
		const r = await useCase().execute("rc1");
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: "APROVADO_FORNECEDOR", recusadoEm: null }),
		);
	});

	it("registra recusa do stub", async () => {
		gateway.buscarDetalhePorId
			.mockResolvedValueOnce({ id: "rc1", status: "CRIADO", quantidadeSolicitada: 100, insumo: { codigo: "P-001" } })
			.mockResolvedValueOnce({ id: "rc1", status: "RECUSADO_FORNECEDOR" });
		fornecedor.enviarCompra.mockReturnValueOnce({ aprovado: false, codigo: "RECUSADO_STUB", mensagem: "limite", payload: {} });
		const r = await useCase().execute("rc1");
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: "RECUSADO_FORNECEDOR", aprovadoEm: null, motivoRecusa: "limite" }),
		);
	});
});
