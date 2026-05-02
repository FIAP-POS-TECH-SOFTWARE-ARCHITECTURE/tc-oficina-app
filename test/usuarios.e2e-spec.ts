import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";

describe("Usuarios (e2e)", () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let adminToken: string;
	let atendenteToken: string;

	beforeAll(async () => {
		app = await setupApp();
		prisma = app.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await truncateAll(prisma);
		adminToken = (await loginAs(app, prisma, Role.ADMINISTRADOR)).token;
		atendenteToken = (await loginAs(app, prisma, Role.ATENDENTE)).token;
	});

	function payload(over: Partial<{ nome: string; email: string; senha: string; role: Role }> = {}) {
		return {
			nome: over.nome ?? "Novo Usuario",
			email: over.email ?? `novo-${Date.now()}@e2e.test`,
			senha: over.senha ?? "Senha12345!",
			role: over.role ?? Role.MECANICO,
		};
	}

	it("POST /usuarios (admin) happy → 201", async () => {
		const res = await request(app.getHttpServer())
			.post("/usuarios")
			.set("Authorization", bearer(adminToken))
			.send(payload({ email: "novo1@e2e.test" }));
		expect(res.status).toBe(201);
		expect(res.body.data.email).toBe("novo1@e2e.test");
	});

	it("POST /usuarios email duplicado → 409", async () => {
		const body = payload({ email: "dup@e2e.test" });
		await request(app.getHttpServer()).post("/usuarios").set("Authorization", bearer(adminToken)).send(body);
		const res = await request(app.getHttpServer()).post("/usuarios").set("Authorization", bearer(adminToken)).send(body);
		expect(res.status).toBe(409);
	});

	it("POST /usuarios DTO inválido (senha < 8) → 400", async () => {
		const res = await request(app.getHttpServer())
			.post("/usuarios")
			.set("Authorization", bearer(adminToken))
			.send(payload({ senha: "123" }));
		expect(res.status).toBe(400);
	});

	it("POST /usuarios (atendente) → 403", async () => {
		const res = await request(app.getHttpServer()).post("/usuarios").set("Authorization", bearer(atendenteToken)).send(payload());
		expect(res.status).toBe(403);
	});

	it("GET /usuarios (admin) → 200 lista", async () => {
		const res = await request(app.getHttpServer()).get("/usuarios").set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBeGreaterThanOrEqual(2);
	});

	it("GET /usuarios/:id (admin) inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.get("/usuarios/00000000-0000-4000-8000-000000000000")
			.set("Authorization", bearer(adminToken));
		expect(res.status).toBe(404);
	});

	it("GET /usuarios/:id UUID inválido → 400 (ParseUUIDPipe)", async () => {
		const res = await request(app.getHttpServer()).get("/usuarios/nao-uuid").set("Authorization", bearer(adminToken));
		expect(res.status).toBe(400);
	});

	it("PATCH /usuarios/:id (admin) → 200", async () => {
		const created = await request(app.getHttpServer())
			.post("/usuarios")
			.set("Authorization", bearer(adminToken))
			.send(payload({ email: "patch@e2e.test" }));
		const id = created.body.data.id;

		const res = await request(app.getHttpServer())
			.patch(`/usuarios/${id}`)
			.set("Authorization", bearer(adminToken))
			.send({ nome: "Atualizado" });
		expect(res.status).toBe(200);
		expect(res.body.data.nome).toBe("Atualizado");
	});

	it("PATCH /usuarios/:id/senha (próprio) → 200", async () => {
		const fixture = await loginAs(app, prisma, Role.MECANICO);
		const res = await request(app.getHttpServer())
			.patch(`/usuarios/${fixture.user.id}/senha`)
			.set("Authorization", bearer(fixture.token))
			.send({ senha: "NovaSenha12345!" });
		expect(res.status).toBe(200);
	});

	it("PATCH /usuarios/:id/senha (outro não-admin) → 403", async () => {
		const alvo = await loginAs(app, prisma, Role.MECANICO);
		const res = await request(app.getHttpServer())
			.patch(`/usuarios/${alvo.user.id}/senha`)
			.set("Authorization", bearer(atendenteToken))
			.send({ senha: "NovaSenha12345!" });
		expect(res.status).toBe(403);
	});

	it("PATCH /usuarios/:id/senha (admin altera de outro) → 200", async () => {
		const alvo = await loginAs(app, prisma, Role.MECANICO);
		const res = await request(app.getHttpServer())
			.patch(`/usuarios/${alvo.user.id}/senha`)
			.set("Authorization", bearer(adminToken))
			.send({ senha: "NovaSenha12345!" });
		expect(res.status).toBe(200);
	});

	it("DELETE /usuarios/:id (admin) → 200 soft-delete", async () => {
		const alvo = await loginAs(app, prisma, Role.MECANICO);
		const res = await request(app.getHttpServer()).delete(`/usuarios/${alvo.user.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
		expect(res.body.data.ativo).toBe(false);
	});
});
