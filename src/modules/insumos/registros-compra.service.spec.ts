import { RegistroCompraStatus, TipoMovimentoEstoque } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
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
		} as unknown as jest.Mocked<FornecedorStubService>;
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
		service = new RegistrosCompraService(repo, insumos, fornecedorStub, prisma as unknown as PrismaService);
	});

	it("create retorna 404 quando insumo não existe", async () => {
		insumos.findById.mockResolvedValueOnce(null);
		const r = await service.create({ insumoId: "i1", quantidadeSolicitada: 2 }, "u1");
		expect(r.status).toBe(404);
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
		expect(repo.update).toHaveBeenCalledWith(
			"rc1",
			expect.objectContaining({ status: RegistroCompraStatus.APROVADO_FORNECEDOR }),
		);
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
