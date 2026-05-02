import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";
import { createServico } from "./helpers/factories";

describe("Servicos (e2e)", () => {
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

	it("POST /servicos (admin) happy → 201", async () => {
		const res = await request(app.getHttpServer())
			.post("/servicos")
			.set("Authorization", bearer(adminToken))
			.send({ nome: "Troca de óleo", preco: 150.5, tempoEstimadoMin: 60 });
		expect(res.status).toBe(201);
	});

	it("POST /servicos nome duplicado → 409", async () => {
		await createServico(app, adminToken, { nome: "Servico Dup" });
		const res = await request(app.getHttpServer())
			.post("/servicos")
			.set("Authorization", bearer(adminToken))
			.send({ nome: "Servico Dup", preco: 100, tempoEstimadoMin: 60 });
		expect(res.status).toBe(409);
	});

	it("POST /servicos preço com 3 decimais → 400", async () => {
		const res = await request(app.getHttpServer())
			.post("/servicos")
			.set("Authorization", bearer(adminToken))
			.send({ nome: "Decimal", preco: 100.123, tempoEstimadoMin: 60 });
		expect(res.status).toBe(400);
	});

	it("POST /servicos preço negativo → 400", async () => {
		const res = await request(app.getHttpServer())
			.post("/servicos")
			.set("Authorization", bearer(adminToken))
			.send({ nome: "Neg", preco: -10, tempoEstimadoMin: 60 });
		expect(res.status).toBe(400);
	});

	it("POST /servicos tempoEstimadoMin < 1 → 400", async () => {
		const res = await request(app.getHttpServer())
			.post("/servicos")
			.set("Authorization", bearer(adminToken))
			.send({ nome: "Tempo", preco: 100, tempoEstimadoMin: 0 });
		expect(res.status).toBe(400);
	});

	it("POST /servicos (atendente) → 403", async () => {
		const res = await request(app.getHttpServer())
			.post("/servicos")
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "X", preco: 100, tempoEstimadoMin: 60 });
		expect(res.status).toBe(403);
	});

	it("GET /servicos (qualquer autenticado) → 200", async () => {
		const res = await request(app.getHttpServer()).get("/servicos").set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(200);
	});

	it("GET /servicos/:id inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.get("/servicos/00000000-0000-4000-8000-000000000000")
			.set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(404);
	});

	it("PATCH /servicos/:id (admin) → 200", async () => {
		const s = await createServico(app, adminToken);
		const res = await request(app.getHttpServer())
			.patch(`/servicos/${s.id}`)
			.set("Authorization", bearer(adminToken))
			.send({ preco: 200 });
		expect(res.status).toBe(200);
	});

	it("DELETE /servicos/:id (admin) → 200 soft-delete", async () => {
		const s = await createServico(app, adminToken);
		const res = await request(app.getHttpServer()).delete(`/servicos/${s.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
		expect(res.body.data.ativo).toBe(false);
	});
});
