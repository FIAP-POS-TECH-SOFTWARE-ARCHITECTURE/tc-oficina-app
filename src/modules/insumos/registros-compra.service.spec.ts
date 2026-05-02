import { RegistroCompraStatus, TipoMovimentoEstoque } from "@prisma/client";
import { FornecedorStubService } from "./fornecedor-stub.service";
import { InsumosRepository } from "./insumos.repository";
import { RegistrosCompraRepository } from "./registros-compra.repository";
import { RegistrosCompraService } from "./registros-compra.service";

describe("RegistrosCompraService", () => {
	let repo: jest.Mocked<RegistrosCompraRepository>;
	let insumos: jest.Mocked<InsumosRepository>;
	let fornecedorStub: jest.Mocked<FornecedorStubService>;
	let prisma: any;
	let service: RegistrosCompraService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByIdFull: jest.fn(),
			findAll: jest.fn(),
			update: jest.fn(),
		} as unknown as jest.Mocked<RegistrosCompraRepository>;
		insumos = {
			findById: jest.fn(),
		} as unknown as jest.Mocked<InsumosRepository>;
		fornecedorStub = {
			enviarCompra: jest.fn(),
		};
		prisma = {
			ordemServico: { findUnique: jest.fn() },
			$transaction: jest.fn(async (fn: any) =>
				fn({
					insumo: { findUnique: jest.fn(), update: jest.fn() },
					movimentoEstoque: { create: jest.fn() },
					registroCompra: { update: jest.fn() },
				}),
			),
		};
		service = new RegistrosCompraService(repo, insumos, fornecedorStub, prisma);
	});

	it("create retorna 404 quando insumo não existe", async () => {
		insumos.findById.mockResolvedValueOnce(null);
		const r = await service.create({ insumoId: "i1", quantidadeSolicitada: 2 }, "u1");
		expect(r.status).toBe(404);
	});

	it("create 404 quando ordemServicoId fornecida mas OS não existe", async () => {
		insumos.findById.mockResolvedValueOnce({ id: "i1" } as any);
		prisma.ordemServico.findUnique.mockResolvedValueOnce(null);
		const r = await service.create({ insumoId: "i1", quantidadeSolicitada: 2, ordemServicoId: "os1" }, "u1");
		expect(r.status).toBe(404);
	});

	it("create 201 com ordemServicoId quando OS existe", async () => {
		insumos.findById.mockResolvedValueOnce({ id: "i1" } as any);
		prisma.ordemServico.findUnique.mockResolvedValueOnce({ id: "os1" });
		repo.create.mockResolvedValueOnce({ id: "rc1" } as any);
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1" } as any);
		const r = await service.create({ insumoId: "i1", quantidadeSolicitada: 2, ordemServicoId: "os1" }, "u1");
		expect(r.status).toBe(201);
		expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ ordemServico: { connect: { id: "os1" } } }));
	});

	it("create 201 sem ordemServicoId", async () => {
		insumos.findById.mockResolvedValueOnce({ id: "i1" } as any);
		repo.create.mockResolvedValueOnce({ id: "rc1" } as any);
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1" } as any);
		const r = await service.create({ insumoId: "i1", quantidadeSolicitada: 2 }, "u1");
		expect(r.status).toBe(201);
	});

	it("list devolve coleção", async () => {
		repo.findAll.mockResolvedValueOnce([{ id: "rc1" }] as any);
		expect((await service.list()).status).toBe(200);
	});

	it("findById 404", async () => {
		repo.findByIdFull.mockResolvedValueOnce(null);
		expect((await service.findById("x")).status).toBe(404);
	});

	it("findById 200", async () => {
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1" } as any);
		expect((await service.findById("rc1")).status).toBe(200);
	});

	it("enviarFornecedor 404 quando registro não existe", async () => {
		repo.findByIdFull.mockResolvedValueOnce(null);
		expect((await service.enviarFornecedor("x")).status).toBe(404);
	});

	it("enviarFornecedor 422 quando status não é CRIADO", async () => {
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.APROVADO_FORNECEDOR } as any);
		expect((await service.enviarFornecedor("rc1")).status).toBe(422);
	});

	it("enviarFornecedor registra recusa do stub", async () => {
		repo.findByIdFull
			.mockResolvedValueOnce({
				id: "rc1",
				status: RegistroCompraStatus.CRIADO,
				quantidadeSolicitada: 100,
				insumo: { codigo: "P-001" },
			} as any)
			.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.RECUSADO_FORNECEDOR } as any);
		fornecedorStub.enviarCompra.mockReturnValueOnce({
			aprovado: false,
			codigo: "RECUSADO_STUB",
			mensagem: "limite",
			payload: {},
		});
		const r = await service.enviarFornecedor("rc1");
		expect(r.status).toBe(200);
		expect(repo.update).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: RegistroCompraStatus.RECUSADO_FORNECEDOR, aprovadoEm: null }),
		);
	});

	it("registrarRespostaFornecedor 404 quando registro não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		expect((await service.registrarRespostaFornecedor("x", { aprovado: true })).status).toBe(404);
	});

	it("registrarRespostaFornecedor 422 quando status não é CRIADO", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.RECEBIDO } as any);
		expect((await service.registrarRespostaFornecedor("rc1", { aprovado: false })).status).toBe(422);
	});

	it("registrarRespostaFornecedor 400 ao recusar sem motivo nem mensagem", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.CRIADO } as any);
		expect((await service.registrarRespostaFornecedor("rc1", { aprovado: false })).status).toBe(400);
	});

	it("registrarRespostaFornecedor 200 aprovando", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.CRIADO } as any);
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1" } as any);
		const r = await service.registrarRespostaFornecedor("rc1", { aprovado: true, codigo: "X", mensagem: "ok" });
		expect(r.status).toBe(200);
		expect(repo.update).toHaveBeenCalledWith("rc1", expect.objectContaining({ status: RegistroCompraStatus.APROVADO_FORNECEDOR }));
	});

	it("registrarRespostaFornecedor 200 recusando com motivoRecusa", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.CRIADO } as any);
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1" } as any);
		const r = await service.registrarRespostaFornecedor("rc1", { aprovado: false, motivoRecusa: "sem estoque" });
		expect(r.status).toBe(200);
		expect(repo.update).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({
				status: RegistroCompraStatus.RECUSADO_FORNECEDOR,
				motivoRecusa: "sem estoque",
			}),
		);
	});

	it("cancelar 404 quando não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		expect((await service.cancelar("x", { motivo: "y" })).status).toBe(404);
	});

	it("cancelar 422 quando já cancelado", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.CANCELADO } as any);
		expect((await service.cancelar("rc1", { motivo: "y" })).status).toBe(422);
	});

	it("cancelar 200 quando aprovado pelo fornecedor", async () => {
		repo.findById.mockResolvedValueOnce({
			id: "rc1",
			status: RegistroCompraStatus.APROVADO_FORNECEDOR,
		} as any);
		repo.findByIdFull.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.CANCELADO } as any);
		const r = await service.cancelar("rc1", { motivo: "desistência" });
		expect(r.status).toBe(200);
		expect(repo.update).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: RegistroCompraStatus.CANCELADO, motivoCancelamento: "desistência" }),
		);
	});

	it("receber 404 quando registro não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		expect(
			(
				await service.receber(
					"x",
					{ notaFiscalNumero: "NF-1", arquivoNome: "x", arquivoTipo: "y", arquivoTamanho: 1, arquivoUrl: "u" } as any,
					"u1",
				)
			).status,
		).toBe(404);
	});

	it("receber 422 quando status diferente de APROVADO_FORNECEDOR", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.CRIADO } as any);
		expect(
			(
				await service.receber(
					"rc1",
					{ notaFiscalNumero: "NF-1", arquivoNome: "x", arquivoTipo: "y", arquivoTamanho: 1, arquivoUrl: "u" } as any,
					"u1",
				)
			).status,
		).toBe(422);
	});

	it("receber lança erro se insumo não encontrado dentro da transação", async () => {
		repo.findById.mockResolvedValueOnce({
			id: "rc1",
			status: RegistroCompraStatus.APROVADO_FORNECEDOR,
			insumoId: "iX",
			quantidadeSolicitada: 1,
		} as any);
		const tx = {
			insumo: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
			movimentoEstoque: { create: jest.fn() },
			registroCompra: { update: jest.fn() },
		};
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));
		await expect(
			service.receber(
				"rc1",
				{ notaFiscalNumero: "NF-1", arquivoNome: "x", arquivoTipo: "y", arquivoTamanho: 1, arquivoUrl: "u" } as any,
				"u1",
			),
		).rejects.toThrow();
	});

	it("enviarFornecedor registra aprovação do stub", async () => {
		repo.findByIdFull
			.mockResolvedValueOnce({
				id: "rc1",
				status: RegistroCompraStatus.CRIADO,
				quantidadeSolicitada: 2,
				insumo: { codigo: "P-001" },
			} as any)
			.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.APROVADO_FORNECEDOR } as any);
		fornecedorStub.enviarCompra.mockReturnValueOnce({
			aprovado: true,
			codigo: "APROVADO_STUB",
			mensagem: "ok",
			payload: {},
		});

		const r = await service.enviarFornecedor("rc1");
		expect(r.status).toBe(200);
		expect(repo.update).toHaveBeenCalledWith("rc1", expect.objectContaining({ status: RegistroCompraStatus.APROVADO_FORNECEDOR }));
	});

	it("cancelar rejeita registro já recebido", async () => {
		repo.findById.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.RECEBIDO } as any);
		const r = await service.cancelar("rc1", { motivo: "sem necessidade" });
		expect(r.status).toBe(422);
	});

	it("receber registra entrada no estoque e muda status para RECEBIDO", async () => {
		repo.findById
			.mockResolvedValueOnce({
				id: "rc1",
				status: RegistroCompraStatus.APROVADO_FORNECEDOR,
				insumoId: "i1",
				quantidadeSolicitada: 4,
			} as any)
			.mockResolvedValueOnce({ id: "rc1", status: RegistroCompraStatus.RECEBIDO } as any);

		const tx = {
			insumo: {
				findUnique: jest.fn().mockResolvedValue({ id: "i1", quantidadeEstoque: 6 }),
				update: jest.fn(),
			},
			movimentoEstoque: { create: jest.fn() },
			registroCompra: { update: jest.fn() },
		};
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		const r = await service.receber(
			"rc1",
			{
				notaFiscalNumero: "NF-1",
				arquivoNome: "nf-1.pdf",
				arquivoTipo: "application/pdf",
				arquivoTamanho: 12345,
				arquivoUrl: "s3://bucket/nf-1.pdf",
			},
			"u1",
		);

		expect(r.status).toBe(200);
		expect(tx.movimentoEstoque.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					tipo: TipoMovimentoEstoque.ENTRADA,
					quantidade: 4,
					quantidadeAnterior: 6,
					quantidadePosterior: 10,
				}),
			}),
		);
		expect(tx.registroCompra.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ status: RegistroCompraStatus.RECEBIDO }),
			}),
		);
	});
});
