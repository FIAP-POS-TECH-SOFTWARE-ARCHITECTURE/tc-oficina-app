import { InsumosRepository } from "./insumos.repository";

describe("InsumosRepository", () => {
	let prisma: any;
	let repo: InsumosRepository;

	beforeEach(() => {
		prisma = {
			insumo: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
				fields: { estoqueMinimo: Symbol("estoqueMinimo") },
			},
			movimentoEstoque: { findMany: jest.fn() },
		};
		repo = new InsumosRepository(prisma);
	});

	it("create delega", async () => {
		await repo.create({ codigo: "P-001", nome: "Filtro", precoUnitario: 10 });
		expect(prisma.insumo.create).toHaveBeenCalled();
	});

	it("findById/findByCodigo", async () => {
		await repo.findById("i1");
		await repo.findByCodigo("P-001");
		expect(prisma.insumo.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "i1" } });
		expect(prisma.insumo.findUnique).toHaveBeenNthCalledWith(2, { where: { codigo: "P-001" } });
	});

	it("findAll/findEstoqueBaixo ordenam por nome asc", async () => {
		await repo.findAll();
		await repo.findEstoqueBaixo();
		expect(prisma.insumo.findMany).toHaveBeenNthCalledWith(1, { orderBy: { nome: "asc" } });
		expect(prisma.insumo.findMany).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ where: expect.objectContaining({ ativo: true }), orderBy: { nome: "asc" } }),
		);
	});

	it("update/softDelete", async () => {
		await repo.update("i1", { nome: "Z" });
		await repo.softDelete("i1");
		expect(prisma.insumo.update).toHaveBeenNthCalledWith(1, { where: { id: "i1" }, data: { nome: "Z" } });
		expect(prisma.insumo.update).toHaveBeenNthCalledWith(2, { where: { id: "i1" }, data: { ativo: false } });
	});

	it("listarMovimentos filtra e ordena desc", async () => {
		await repo.listarMovimentos("i1");
		expect(prisma.movimentoEstoque.findMany).toHaveBeenCalledWith({
			where: { insumoId: "i1" },
			orderBy: { createdAt: "desc" },
		});
	});
});
