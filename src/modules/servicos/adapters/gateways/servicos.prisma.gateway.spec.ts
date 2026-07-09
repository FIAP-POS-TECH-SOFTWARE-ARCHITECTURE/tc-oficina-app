import { ServicosPrismaGateway } from "./servicos.prisma.gateway";

describe("ServicosPrismaGateway", () => {
	let prisma: any;
	let gateway: ServicosPrismaGateway;

	beforeEach(() => {
		prisma = {
			servico: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
			},
		};
		gateway = new ServicosPrismaGateway(prisma);
	});

	it("criar delega", async () => {
		await gateway.criar({ nome: "X", preco: 10, tempoEstimadoMin: 30 });
		expect(prisma.servico.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ nome: "X", preco: 10, tempoEstimadoMin: 30 }),
		});
	});

	it("buscarPorId e buscarPorNome", async () => {
		await gateway.buscarPorId("s1");
		await gateway.buscarPorNome("X");
		expect(prisma.servico.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "s1" } });
		expect(prisma.servico.findUnique).toHaveBeenNthCalledWith(2, { where: { nome: "X" } });
	});

	it("listarTodos ordena por nome asc", async () => {
		await gateway.listarTodos();
		expect(prisma.servico.findMany).toHaveBeenCalledWith({ orderBy: { nome: "asc" } });
	});

	it("atualizar e inativar", async () => {
		await gateway.atualizar("s1", { preco: 99 });
		await gateway.inativar("s1");
		expect(prisma.servico.update).toHaveBeenNthCalledWith(1, { where: { id: "s1" }, data: { preco: 99 } });
		expect(prisma.servico.update).toHaveBeenNthCalledWith(2, { where: { id: "s1" }, data: { ativo: false } });
	});
});
