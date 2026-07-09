import { VeiculosPrismaGateway } from "./veiculos.prisma.gateway";

describe("VeiculosPrismaGateway", () => {
	let prisma: any;
	let gateway: VeiculosPrismaGateway;

	beforeEach(() => {
		prisma = {
			veiculo: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
			},
			ordemServico: { count: jest.fn() },
		};
		gateway = new VeiculosPrismaGateway(prisma);
	});

	it("criar delega", async () => {
		await gateway.criar({ placa: "ABC1234", marca: "X", modelo: "Y", ano: 2020, clienteId: "c1" });
		expect(prisma.veiculo.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ placa: "ABC1234", clienteId: "c1" }),
		});
	});

	it("buscarPorId/buscarPorPlaca usam where corretamente", async () => {
		await gateway.buscarPorId("v1");
		await gateway.buscarPorPlaca("ABC1234");
		expect(prisma.veiculo.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "v1" } });
		expect(prisma.veiculo.findUnique).toHaveBeenNthCalledWith(2, { where: { placa: "ABC1234" } });
	});

	it("listarPorCliente filtra e ordena", async () => {
		await gateway.listarPorCliente("c1");
		expect(prisma.veiculo.findMany).toHaveBeenCalledWith({
			where: { clienteId: "c1" },
			orderBy: { createdAt: "desc" },
		});
	});

	it("atualizar e inativar", async () => {
		await gateway.atualizar("v1", { marca: "Z" });
		await gateway.inativar("v1");
		expect(prisma.veiculo.update).toHaveBeenNthCalledWith(1, { where: { id: "v1" }, data: { marca: "Z" } });
		expect(prisma.veiculo.update).toHaveBeenNthCalledWith(2, { where: { id: "v1" }, data: { ativo: false } });
	});

	it("contarOrdensAbertas conta status não-finais", async () => {
		prisma.ordemServico.count.mockResolvedValueOnce(0);
		await gateway.contarOrdensAbertas("v1");
		expect(prisma.ordemServico.count).toHaveBeenCalledWith({
			where: { veiculoId: "v1", status: { notIn: ["ENTREGUE", "CANCELADA"] } },
		});
	});
});
