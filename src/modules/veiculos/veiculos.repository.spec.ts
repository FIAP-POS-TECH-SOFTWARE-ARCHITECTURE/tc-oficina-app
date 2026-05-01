import { VeiculosRepository } from "./veiculos.repository";

describe("VeiculosRepository", () => {
	let prisma: any;
	let repo: VeiculosRepository;

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
		repo = new VeiculosRepository(prisma);
	});

	it("create delega", async () => {
		await repo.create({ placa: "ABC1234", marca: "X", modelo: "Y", ano: 2020, clienteId: "c1" });
		expect(prisma.veiculo.create).toHaveBeenCalled();
	});

	it("findById/findByPlaca usam where corretamente", async () => {
		await repo.findById("v1");
		await repo.findByPlaca("ABC1234");
		expect(prisma.veiculo.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "v1" } });
		expect(prisma.veiculo.findUnique).toHaveBeenNthCalledWith(2, { where: { placa: "ABC1234" } });
	});

	it("findByCliente filtra e ordena", async () => {
		await repo.findByCliente("c1");
		expect(prisma.veiculo.findMany).toHaveBeenCalledWith({
			where: { clienteId: "c1" },
			orderBy: { createdAt: "desc" },
		});
	});

	it("update e softDelete", async () => {
		await repo.update("v1", { marca: "Z" });
		await repo.softDelete("v1");
		expect(prisma.veiculo.update).toHaveBeenNthCalledWith(1, { where: { id: "v1" }, data: { marca: "Z" } });
		expect(prisma.veiculo.update).toHaveBeenNthCalledWith(2, { where: { id: "v1" }, data: { ativo: false } });
	});

	it("hasOrdensAbertas conta status não-finais", async () => {
		prisma.ordemServico.count.mockResolvedValueOnce(0);
		await repo.hasOrdensAbertas("v1");
		expect(prisma.ordemServico.count).toHaveBeenCalledWith({
			where: { veiculoId: "v1", status: { notIn: ["ENTREGUE", "CANCELADA"] } },
		});
	});
});
