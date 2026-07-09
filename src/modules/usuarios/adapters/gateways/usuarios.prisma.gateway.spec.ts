import { Role } from "@prisma/client";
import { UsuariosPrismaGateway } from "./usuarios.prisma.gateway";

describe("UsuariosPrismaGateway", () => {
	let prisma: any;
	let gateway: UsuariosPrismaGateway;

	beforeEach(() => {
		prisma = {
			usuario: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
				count: jest.fn(),
			},
		};
		gateway = new UsuariosPrismaGateway(prisma);
	});

	it("criar delega", async () => {
		await gateway.criar({ nome: "X", email: "a@a", senhaHash: "h", role: Role.ADMINISTRADOR });
		expect(prisma.usuario.create).toHaveBeenCalledWith({
			data: { nome: "X", email: "a@a", senhaHash: "h", role: Role.ADMINISTRADOR },
		});
	});

	it("buscarPorId e buscarPorEmail", async () => {
		await gateway.buscarPorId("u1");
		await gateway.buscarPorEmail("a@a");
		expect(prisma.usuario.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "u1" } });
		expect(prisma.usuario.findUnique).toHaveBeenNthCalledWith(2, { where: { email: "a@a" } });
	});

	it("listarTodos ordena por createdAt desc", async () => {
		await gateway.listarTodos();
		expect(prisma.usuario.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
	});

	it("atualizar e inativar", async () => {
		await gateway.atualizar("u1", { nome: "Y" });
		await gateway.inativar("u1");
		expect(prisma.usuario.update).toHaveBeenNthCalledWith(1, { where: { id: "u1" }, data: { nome: "Y" } });
		expect(prisma.usuario.update).toHaveBeenNthCalledWith(2, { where: { id: "u1" }, data: { ativo: false } });
	});

	it("contarAdminsAtivos conta admins ativos", async () => {
		prisma.usuario.count.mockResolvedValueOnce(3);
		const n = await gateway.contarAdminsAtivos();
		expect(n).toBe(3);
		expect(prisma.usuario.count).toHaveBeenCalledWith({ where: { role: Role.ADMINISTRADOR, ativo: true } });
	});
});
