import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { truncateAll } from "./helpers/db";

describe("Auth (e2e) — POST /auth/login", () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		app = await setupApp();
		prisma = app.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await truncateAll(prisma);
	});

	async function criarUsuario(
		opts: {
			email?: string;
			senha?: string;
			role?: Role;
			ativo?: boolean;
		} = {},
	) {
		const senha = opts.senha ?? "Senha12345!";
		const senhaHash = await argon2.hash(senha);
		const u = await prisma.usuario.create({
			data: {
				nome: "Teste",
				email: opts.email ?? "user@e2e.test",
				senhaHash,
				role: opts.role ?? Role.ATENDENTE,
				ativo: opts.ativo ?? true,
			},
		});
		return { user: u, senha };
	}

	it("happy path retorna 200, accessToken e user", async () => {
		const { user, senha } = await criarUsuario({ email: "happy@e2e.test" });
		const res = await request(app.getHttpServer()).post("/auth/login").send({ email: user.email, senha });

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.accessToken).toEqual(expect.any(String));
		expect(res.body.data.user).toMatchObject({
			id: user.id,
			email: user.email,
			role: user.role,
		});
	});

	it("email inexistente retorna 401", async () => {
		const res = await request(app.getHttpServer()).post("/auth/login").send({ email: "naoexiste@e2e.test", senha: "Senha12345!" });

		expect(res.status).toBe(401);
		expect(res.body.success).toBe(false);
	});

	it("senha errada retorna 401", async () => {
		await criarUsuario({ email: "wrongpass@e2e.test" });
		const res = await request(app.getHttpServer()).post("/auth/login").send({ email: "wrongpass@e2e.test", senha: "ErradoErrado1" });

		expect(res.status).toBe(401);
		expect(res.body.success).toBe(false);
	});

	it("usuário inativo retorna 401", async () => {
		const { senha } = await criarUsuario({ email: "inativo@e2e.test", ativo: false });
		const res = await request(app.getHttpServer()).post("/auth/login").send({ email: "inativo@e2e.test", senha });

		expect(res.status).toBe(401);
	});

	it("email malformado retorna 400 (ValidationPipe)", async () => {
		const res = await request(app.getHttpServer()).post("/auth/login").send({ email: "naoeumemail", senha: "Senha12345!" });

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});
});
