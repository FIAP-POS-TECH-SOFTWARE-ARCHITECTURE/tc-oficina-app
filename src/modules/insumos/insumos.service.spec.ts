import { TipoMovimentoEstoque } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { InsumosRepository } from "./insumos.repository";
import { InsumosService } from "./insumos.service";

describe("InsumosService", () => {
	let repo: jest.Mocked<InsumosRepository>;
	let prisma: { $transaction: jest.Mock };
	let service: InsumosService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByCodigo: jest.fn(),
			findAll: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn(),
			findEstoqueBaixo: jest.fn(),
			listarMovimentos: jest.fn(),
		} as unknown as jest.Mocked<InsumosRepository>;

		prisma = {
			$transaction: jest.fn(async (fn: any) => {
				const tx = {
					insumo: { update: jest.fn(async (args: any) => ({ id: args.where.id, ...args.data })) },
					movimentoEstoque: { create: jest.fn() },
				};
				return fn(tx);
			}),
		};
		service = new InsumosService(repo, prisma as unknown as PrismaService);
	});

	it("create rejeita código duplicado com 409", async () => {
		repo.findByCodigo.mockResolvedValueOnce({ id: "x" } as any);
		const r = await service.create({
			codigo: "P-001",
			nome: "Filtro",
			precoUnitario: 10,
		});
		expect(r.status).toBe(409);
	});

	it("create persiste insumo novo com 201", async () => {
		repo.findByCodigo.mockResolvedValueOnce(null);
		repo.create.mockResolvedValueOnce({ id: "novo" } as any);
		const r = await service.create({
			codigo: "P-001",
			nome: "Filtro",
			precoUnitario: 10,
		});
		expect(r.status).toBe(201);
	});

	it("entrada incrementa estoque e cria movimento ENTRADA", async () => {
		repo.findById.mockResolvedValueOnce({
			id: "i1",
			quantidadeEstoque: 5,
		} as any);
		const txMock = {
			insumo: { update: jest.fn().mockResolvedValue({ id: "i1", quantidadeEstoque: 8 }) },
			movimentoEstoque: { create: jest.fn() },
		};
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(txMock));
		const r = await service.entrada("i1", { quantidade: 3 }, "user-1");
		expect(r.status).toBe(200);
		expect(txMock.movimentoEstoque.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					tipo: TipoMovimentoEstoque.ENTRADA,
					quantidade: 3,
					quantidadeAnterior: 5,
					quantidadePosterior: 8,
				}),
			}),
		);
	});

	it("ajuste rejeita quantidade negativa", async () => {
		repo.findById.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 5 } as any);
		const r = await service.ajuste("i1", { novaQuantidade: -1, motivo: "erro" }, "u1");
		expect(r.status).toBe(400);
	});

	it("findById retorna 404 quando não encontra", async () => {
		repo.findById.mockResolvedValueOnce(null);
		const r = await service.findById("nope");
		expect(r.status).toBe(404);
	});

	it("findById retorna 200 quando encontra", async () => {
		repo.findById.mockResolvedValueOnce({ id: "i1" } as any);
		const r = await service.findById("i1");
		expect(r.status).toBe(200);
	});

	it("findAll retorna lista", async () => {
		repo.findAll.mockResolvedValueOnce([{ id: "i1" }] as any);
		const r = await service.findAll();
		expect(r.status).toBe(200);
		expect(r.data?.length).toBe(1);
	});

	it("update 404 quando não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		const r = await service.update("x", { nome: "novo" });
		expect(r.status).toBe(404);
	});

	it("update 200", async () => {
		repo.findById.mockResolvedValueOnce({ id: "i1" } as any);
		repo.update.mockResolvedValueOnce({ id: "i1" } as any);
		const r = await service.update("i1", { nome: "novo" });
		expect(r.status).toBe(200);
	});

	it("remove 404", async () => {
		repo.findById.mockResolvedValueOnce(null);
		const r = await service.remove("x");
		expect(r.status).toBe(404);
	});

	it("remove 200 inativa", async () => {
		repo.findById.mockResolvedValueOnce({ id: "i1" } as any);
		repo.softDelete.mockResolvedValueOnce({ id: "i1", ativo: false } as any);
		const r = await service.remove("i1");
		expect(r.status).toBe(200);
	});

	it("entrada 404 quando insumo não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		const r = await service.entrada("x", { quantidade: 1 }, "u1");
		expect(r.status).toBe(404);
	});

	it("ajuste 404 quando insumo não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		const r = await service.ajuste("x", { novaQuantidade: 1, motivo: "x" }, "u1");
		expect(r.status).toBe(404);
	});

	it("ajuste 200 com delta positivo", async () => {
		repo.findById.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 5 } as any);
		const txMock = {
			insumo: { update: jest.fn().mockResolvedValue({ id: "i1", quantidadeEstoque: 8 }) },
			movimentoEstoque: { create: jest.fn() },
		};
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(txMock));
		const r = await service.ajuste("i1", { novaQuantidade: 8, motivo: "contagem" }, "u1");
		expect(r.status).toBe(200);
	});

	it("listarMovimentos 404 quando insumo não existe", async () => {
		repo.findById.mockResolvedValueOnce(null);
		const r = await service.listarMovimentos("x");
		expect(r.status).toBe(404);
	});

	it("listarMovimentos 200", async () => {
		repo.findById.mockResolvedValueOnce({ id: "i1" } as any);
		repo.listarMovimentos.mockResolvedValueOnce([]);
		const r = await service.listarMovimentos("i1");
		expect(r.status).toBe(200);
	});

	it("alertasEstoqueBaixo retorna lista", async () => {
		repo.findEstoqueBaixo.mockResolvedValueOnce([{ id: "i1" }] as any);
		const r = await service.alertasEstoqueBaixo();
		expect(r.status).toBe(200);
	});
});
