import { ReceberCompraUseCase } from "./receber-compra.use-case";

const gateway = { buscarPorId: jest.fn(), buscarDetalhePorId: jest.fn(), receberComEntradaEstoque: jest.fn() };

const dtoNota = {
	notaFiscalNumero: "NF-1",
	arquivoNome: "nf-1.pdf",
	arquivoTipo: "application/pdf",
	arquivoTamanho: 12345,
	arquivoUrl: "s3://bucket/nf-1.pdf",
};

describe("ReceberCompraUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new ReceberCompraUseCase(gateway as any);

	it("404 quando registro não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x", dtoNota, "u1")).status).toBe(404);
	});

	it("422 quando status diferente de APROVADO_FORNECEDOR", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "rc1", status: "CRIADO" });
		expect((await useCase().execute("rc1", dtoNota, "u1")).status).toBe(422);
	});

	it("propaga erro lançado na transação de recebimento", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({
			id: "rc1",
			status: "APROVADO_FORNECEDOR",
			insumoId: "iX",
			quantidadeSolicitada: 1,
		});
		gateway.receberComEntradaEstoque.mockRejectedValueOnce(new Error("Insumo iX não encontrado"));
		await expect(useCase().execute("rc1", dtoNota, "u1")).rejects.toThrow();
	});

	it("200 registra entrada de estoque e retorna detalhe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({
			id: "rc1",
			status: "APROVADO_FORNECEDOR",
			insumoId: "i1",
			quantidadeSolicitada: 4,
		});
		gateway.receberComEntradaEstoque.mockResolvedValueOnce(undefined);
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1", status: "RECEBIDO" });
		const r = await useCase().execute("rc1", dtoNota, "u1");
		expect(r.status).toBe(200);
		expect(gateway.receberComEntradaEstoque).toHaveBeenCalledWith(
			expect.objectContaining({
				registroId: "rc1",
				insumoId: "i1",
				quantidade: 4,
				usuarioId: "u1",
				motivo: expect.stringContaining("NF-1"),
				notaFiscal: expect.objectContaining({ numero: "NF-1" }),
			}),
		);
	});
});
