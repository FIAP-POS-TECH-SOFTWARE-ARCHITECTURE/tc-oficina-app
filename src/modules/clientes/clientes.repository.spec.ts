import { TipoDocumentoCliente } from "@prisma/client";
import { ClientesRepository } from "./clientes.repository";

describe("ClientesRepository", () => {
	let prisma: any;
	let repo: ClientesRepository;

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
		repo = new ClientesRepository(prisma);
	});

	it("create delega ao prisma.cliente.create", async () => {
		await repo.create({ nome: "X", documento: "52998224725", tipoDocumento: TipoDocumentoCliente.CPF });
		expect(prisma.cliente.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ nome: "X", documento: "52998224725" }),
		});
	});

	it("findById usa where.id", async () => {
		await repo.findById("c1");
		expect(prisma.cliente.findUnique).toHaveBeenCalledWith({ where: { id: "c1" } });
	});

	it("findByDocumento usa where.documento", async () => {
		await repo.findByDocumento("52998224725");
		expect(prisma.cliente.findUnique).toHaveBeenCalledWith({ where: { documento: "52998224725" } });
	});

	it("findAll ordena por createdAt desc", async () => {
		await repo.findAll();
		expect(prisma.cliente.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
	});

	it("update delega data + where", async () => {
		await repo.update("c1", { nome: "Y" });
		expect(prisma.cliente.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { nome: "Y" } });
	});

	it("softDelete seta ativo=false", async () => {
		await repo.softDelete("c1");
		expect(prisma.cliente.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { ativo: false } });
	});

	it("hasOrdensAbertas conta OS não-finais", async () => {
		prisma.ordemServico.count.mockResolvedValueOnce(2);
		const n = await repo.hasOrdensAbertas("c1");
		expect(n).toBe(2);
		expect(prisma.ordemServico.count).toHaveBeenCalledWith({
			where: { clienteId: "c1", status: { notIn: ["ENTREGUE", "CANCELADA"] } },
		});
	});
});
