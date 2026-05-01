import * as argon2 from "argon2";
import { Role } from "../../common/enums/role.enum";
import { UsuariosRepository } from "./usuarios.repository";
import { UsuariosService } from "./usuarios.service";

describe("UsuariosService", () => {
	let repo: jest.Mocked<UsuariosRepository>;
	let service: UsuariosService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByEmail: jest.fn(),
			findAll: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn(),
			countAdmins: jest.fn(),
		} as unknown as jest.Mocked<UsuariosRepository>;
		service = new UsuariosService(repo);
	});

	describe("create", () => {
		it("409 quando e-mail já existe", async () => {
			repo.findByEmail.mockResolvedValueOnce({ id: "x" } as any);
			const r = await service.create({
				nome: "X",
				email: "a@a.com",
				senha: "12345678",
				role: Role.ATENDENTE,
			});
			expect(r.status).toBe(409);
		});

		it("201 quando cria com sucesso", async () => {
			repo.findByEmail.mockResolvedValueOnce(null);
			repo.create.mockResolvedValueOnce({
				id: "1",
				nome: "X",
				email: "a@a.com",
				role: Role.ATENDENTE,
				ativo: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			const r = await service.create({
				nome: "X",
				email: "a@a.com",
				senha: "12345678",
				role: Role.ATENDENTE,
			});
			expect(r.status).toBe(201);
		});
	});

	describe("findAll/findById", () => {
		it("findAll retorna lista mapeada", async () => {
			repo.findAll.mockResolvedValueOnce([
				{ id: "1", nome: "X", email: "a@a", role: Role.ATENDENTE, ativo: true, createdAt: new Date(), updatedAt: new Date() },
			] as any);
			const r = await service.findAll();
			expect(r.status).toBe(200);
			expect(r.data?.length).toBe(1);
		});

		it("findById 404 se não encontra", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.findById("nope");
			expect(r.status).toBe(404);
		});

		it("findById 200 quando encontra", async () => {
			repo.findById.mockResolvedValueOnce({
				id: "1",
				nome: "X",
				email: "a@a",
				role: Role.ATENDENTE,
				ativo: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			const r = await service.findById("1");
			expect(r.status).toBe(200);
		});
	});

	describe("update", () => {
		it("404 quando usuário não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.update("1", { nome: "Novo" });
			expect(r.status).toBe(404);
		});

		it("409 quando troca de email já existente", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1", email: "a@a" } as any);
			repo.findByEmail.mockResolvedValueOnce({ id: "2" } as any);
			const r = await service.update("1", { email: "b@b" });
			expect(r.status).toBe(409);
		});

		it("200 quando atualiza", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1", email: "a@a" } as any);
			repo.update.mockResolvedValueOnce({
				id: "1",
				nome: "X",
				email: "a@a",
				role: Role.ATENDENTE,
				ativo: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			const r = await service.update("1", { nome: "X" });
			expect(r.status).toBe(200);
		});
	});

	describe("updateSenha", () => {
		it("403 quando ator é outro usuário não-admin", async () => {
			const r = await service.updateSenha("1", { senha: "12345678" }, { id: "2", role: Role.ATENDENTE });
			expect(r.status).toBe(403);
		});

		it("404 quando usuário não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.updateSenha("1", { senha: "12345678" }, { id: "1", role: Role.ATENDENTE });
			expect(r.status).toBe(404);
		});

		it("200 atualiza senha do próprio usuário", async () => {
			repo.findById.mockResolvedValueOnce({
				id: "1",
				email: "a@a",
				role: Role.ATENDENTE,
			} as any);
			repo.update.mockResolvedValueOnce({
				id: "1",
				nome: "X",
				email: "a@a",
				role: Role.ATENDENTE,
				ativo: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			const r = await service.updateSenha("1", { senha: "12345678" }, { id: "1", role: Role.ATENDENTE });
			expect(r.status).toBe(200);
			expect(repo.update).toHaveBeenCalled();
		});

		it("admin troca senha de qualquer um", async () => {
			repo.findById.mockResolvedValueOnce({
				id: "1",
				email: "a@a",
				role: Role.ATENDENTE,
			} as any);
			repo.update.mockResolvedValueOnce({
				id: "1",
				nome: "X",
				email: "a@a",
				role: Role.ATENDENTE,
				ativo: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			const r = await service.updateSenha("1", { senha: "12345678" }, { id: "99", role: Role.ADMINISTRADOR });
			expect(r.status).toBe(200);
		});
	});

	describe("remove", () => {
		it("404 se não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.remove("1");
			expect(r.status).toBe(404);
		});

		it("200 inativa", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1" } as any);
			repo.softDelete.mockResolvedValueOnce({
				id: "1",
				nome: "X",
				email: "a@a",
				role: Role.ATENDENTE,
				ativo: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);
			const r = await service.remove("1");
			expect(r.status).toBe(200);
		});
	});

	describe("bootstrapAdmin", () => {
		it("não cria se já existe admin", async () => {
			repo.countAdmins.mockResolvedValueOnce(1);
			await service.onModuleInit();
			expect(repo.create).not.toHaveBeenCalled();
		});

		it("cria admin com bcrypt-like hash", async () => {
			repo.countAdmins.mockResolvedValueOnce(0);
			repo.findByEmail.mockResolvedValueOnce(null);
			process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@oficina.local";
			process.env.ADMIN_BOOTSTRAP_PASSWORD = "ChangeMe!123";
			repo.create.mockResolvedValueOnce({} as any);
			await service.onModuleInit();
			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "admin@oficina.local",
					role: Role.ADMINISTRADOR,
				}),
			);
			const args = repo.create.mock.calls[0][0];
			expect(await argon2.verify(args.senhaHash, "ChangeMe!123")).toBe(true);
		});
	});
});
