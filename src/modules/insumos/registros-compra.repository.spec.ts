import { RegistrosCompraRepository } from "./registros-compra.repository";

describe("RegistrosCompraRepository", () => {
	let prisma: any;
	let repo: RegistrosCompraRepository;

	beforeEach(() => {
		prisma = {
			registroCompra: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
			},
		};
		repo = new RegistrosCompraRepository(prisma);
	});

	it("create delega", async () => {
		await repo.create({ quantidadeSolicitada: 1 } as any);
		expect(prisma.registroCompra.create).toHaveBeenCalled();
	});

	it("findById sem include", async () => {
		await repo.findById("rc1");
		expect(prisma.registroCompra.findUnique).toHaveBeenCalledWith({ where: { id: "rc1" } });
	});

	it("findByIdFull com include", async () => {
		await repo.findByIdFull("rc1");
		expect(prisma.registroCompra.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "rc1" }, include: expect.any(Object) }),
		);
	});

	it("findAll ordena por createdAt desc com include", async () => {
		await repo.findAll();
		expect(prisma.registroCompra.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ orderBy: { createdAt: "desc" }, include: expect.any(Object) }),
		);
	});

	it("update delega where+data", async () => {
		await repo.update("rc1", { motivoCancelamento: "x" } as any);
		expect(prisma.registroCompra.update).toHaveBeenCalledWith({ where: { id: "rc1" }, data: { motivoCancelamento: "x" } });
	});
});
