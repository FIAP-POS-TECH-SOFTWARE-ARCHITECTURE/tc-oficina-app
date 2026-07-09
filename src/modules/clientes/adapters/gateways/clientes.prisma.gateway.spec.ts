import { ClientesPrismaGateway } from "./clientes.prisma.gateway";

describe("ClientesPrismaGateway", () => {
	let prisma: any;
	let gateway: ClientesPrismaGateway;

	beforeEach(() => {
		prisma = {
			cliente: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
			},
			ordemServico: { count: jest.fn() },
		};
		gateway = new ClientesPrismaGateway(prisma);
	});

	it("criar delega ao prisma.cliente.create", async () => {
		await gateway.criar({ nome: "X", documento: "52998224725", tipoDocumento: "CPF" });
		expect(prisma.cliente.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ nome: "X", documento: "52998224725", tipoDocumento: "CPF" }),
		});
	});

	it("buscarPorId usa where.id", async () => {
		await gateway.buscarPorId("c1");
		expect(prisma.cliente.findUnique).toHaveBeenCalledWith({ where: { id: "c1" } });
	});

	it("buscarPorDocumento usa where.documento", async () => {
		await gateway.buscarPorDocumento("52998224725");
		expect(prisma.cliente.findUnique).toHaveBeenCalledWith({ where: { documento: "52998224725" } });
	});

	it("listarTodos ordena por createdAt desc", async () => {
		await gateway.listarTodos();
		expect(prisma.cliente.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
	});

	it("atualizar delega data + where", async () => {
		await gateway.atualizar("c1", { nome: "Y" });
		expect(prisma.cliente.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { nome: "Y" } });
	});

	it("inativar seta ativo=false", async () => {
		await gateway.inativar("c1");
		expect(prisma.cliente.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { ativo: false } });
	});

	it("contarOrdensAbertas conta OS não-finais", async () => {
		prisma.ordemServico.count.mockResolvedValueOnce(2);
		const n = await gateway.contarOrdensAbertas("c1");
		expect(n).toBe(2);
		expect(prisma.ordemServico.count).toHaveBeenCalledWith({
			where: { clienteId: "c1", status: { notIn: ["ENTREGUE", "CANCELADA"] } },
		});
	});
});
