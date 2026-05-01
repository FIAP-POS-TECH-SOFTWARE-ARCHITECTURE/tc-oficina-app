import { Role } from "@prisma/client";
import { UsuariosRepository } from "./usuarios.repository";

describe("UsuariosRepository", () => {
	let prisma: any;
	let repo: UsuariosRepository;

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
		repo = new UsuariosRepository(prisma);
	});

	it("create delega", async () => {
		await repo.create({ nome: "X", email: "a@a", senhaHash: "h", role: Role.ADMINISTRADOR });
		expect(prisma.usuario.create).toHaveBeenCalledWith({
			data: { nome: "X", email: "a@a", senhaHash: "h", role: Role.ADMINISTRADOR },
		});
	});

	it("findById e findByEmail", async () => {
		await repo.findById("u1");
		await repo.findByEmail("a@a");
		expect(prisma.usuario.findUnique).toHaveBeenNthCalledWith(1, { where: { id: "u1" } });
		expect(prisma.usuario.findUnique).toHaveBeenNthCalledWith(2, { where: { email: "a@a" } });
	});

	it("findAll ordena por createdAt desc", async () => {
		await repo.findAll();
		expect(prisma.usuario.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
	});

	it("update e softDelete", async () => {
		await repo.update("u1", { nome: "Y" });
		await repo.softDelete("u1");
		expect(prisma.usuario.update).toHaveBeenNthCalledWith(1, { where: { id: "u1" }, data: { nome: "Y" } });
		expect(prisma.usuario.update).toHaveBeenNthCalledWith(2, { where: { id: "u1" }, data: { ativo: false } });
	});

	it("countAdmins conta admins ativos", async () => {
		prisma.usuario.count.mockResolvedValueOnce(3);
		const n = await repo.countAdmins();
		expect(n).toBe(3);
		expect(prisma.usuario.count).toHaveBeenCalledWith({ where: { role: Role.ADMINISTRADOR, ativo: true } });
	});
});
