import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { Role } from "../../common/enums/role.enum";
import { UsuariosRepository } from "../usuarios/usuarios.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
	let service: AuthService;
	let repo: jest.Mocked<UsuariosRepository>;
	let jwt: jest.Mocked<JwtService>;

	beforeEach(() => {
		repo = {
			findByEmail: jest.fn(),
		} as unknown as jest.Mocked<UsuariosRepository>;
		jwt = {
			signAsync: jest.fn().mockResolvedValue("token-123"),
		} as unknown as jest.Mocked<JwtService>;
		service = new AuthService(repo, jwt);
	});

	it("retorna 401 se usuário não existe", async () => {
		repo.findByEmail.mockResolvedValueOnce(null);
		const r = await service.login({ email: "x@x.com", senha: "abc" });
		expect(r.status).toBe(401);
	});

	it("retorna 401 se usuário inativo", async () => {
		repo.findByEmail.mockResolvedValueOnce({
			id: "1",
			email: "x@x.com",
			senhaHash: "hash",
			ativo: false,
			role: Role.ATENDENTE,
		} as any);
		const r = await service.login({ email: "x@x.com", senha: "abc" });
		expect(r.status).toBe(401);
	});

	it("retorna 401 se senha inválida", async () => {
		const senhaHash = await argon2.hash("certa");
		repo.findByEmail.mockResolvedValueOnce({
			id: "1",
			nome: "Fulano",
			email: "x@x.com",
			senhaHash,
			ativo: true,
			role: Role.ATENDENTE,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as any);
		const r = await service.login({ email: "x@x.com", senha: "errada" });
		expect(r.status).toBe(401);
	});

	it("retorna 200 com accessToken se senha correta", async () => {
		const senhaHash = await argon2.hash("certa");
		repo.findByEmail.mockResolvedValueOnce({
			id: "1",
			nome: "Fulano",
			email: "x@x.com",
			senhaHash,
			ativo: true,
			role: Role.ATENDENTE,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as any);
		const r = await service.login({ email: "x@x.com", senha: "certa" });
		expect(r.status).toBe(200);
		expect(r.data?.accessToken).toBe("token-123");
		expect(r.data?.user.email).toBe("x@x.com");
	});
});
