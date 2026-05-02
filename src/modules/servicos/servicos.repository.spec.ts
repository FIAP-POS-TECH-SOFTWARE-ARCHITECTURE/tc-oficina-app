import { ServicosRepository } from "./servicos.repository";

describe("ServicosRepository", () => {
	let prisma: any;
	let repo: ServicosRepository;

	beforeEach(() => {
		prisma = {
			servico: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
			},
		};
		repo = new ServicosRepository(prisma);
	});

	it("create delega", async () => {
		await repo.create({ nome: "X", preco: 10, tempoEstimadoMin: 30 });
		expect(prisma.servico.create).toHaveBeenCalled();
	});

	it("findById e findByNome", async () => {
		await repo.findById("s1");
		await repo.findByNome("X");
		expect(prisma.servico.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "s1" } });
		expect(prisma.servico.findUnique).toHaveBeenNthCalledWith(2, { where: { nome: "X" } });
	});

	it("findAll ordena por nome asc", async () => {
		await repo.findAll();
		expect(prisma.servico.findMany).toHaveBeenCalledWith({ orderBy: { nome: "asc" } });
	});

	it("update e softDelete", async () => {
		await repo.update("s1", { preco: 99 });
		await repo.softDelete("s1");
		expect(prisma.servico.update).toHaveBeenNthCalledWith(1, { where: { id: "s1" }, data: { preco: 99 } });
		expect(prisma.servico.update).toHaveBeenNthCalledWith(2, { where: { id: "s1" }, data: { ativo: false } });
	});
});
