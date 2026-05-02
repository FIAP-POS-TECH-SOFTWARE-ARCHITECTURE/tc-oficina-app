import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";
import { CNPJ_VALIDOS, CPF_VALIDOS, createCliente, createOS, createVeiculo } from "./helpers/factories";

describe("Clientes (e2e)", () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let atendenteToken: string;
	let adminToken: string;
	let mecanicoToken: string;

	beforeAll(async () => {
		app = await setupApp();
		prisma = app.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await truncateAll(prisma);
		atendenteToken = (await loginAs(app, prisma, Role.ATENDENTE)).token;
		adminToken = (await loginAs(app, prisma, Role.ADMINISTRADOR)).token;
		mecanicoToken = (await loginAs(app, prisma, Role.MECANICO)).token;
	});

	it("POST /clientes (atendente) PF happy → 201", async () => {
		const res = await request(app.getHttpServer())
			.post("/clientes")
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "PF Cliente", documento: CPF_VALIDOS[0] });
		expect(res.status).toBe(201);
		expect(res.body.data.tipoDocumento).toBe("CPF");
	});

	it("POST /clientes (atendente) PJ happy → 201", async () => {
		const res = await request(app.getHttpServer())
			.post("/clientes")
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "PJ Cliente", documento: CNPJ_VALIDOS[0] });
		expect(res.status).toBe(201);
		expect(res.body.data.tipoDocumento).toBe("CNPJ");
	});

	it("POST /clientes documento inválido → 400", async () => {
		const res = await request(app.getHttpServer())
			.post("/clientes")
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "Erro", documento: "11111111111" });
		expect(res.status).toBe(400);
	});

	it("POST /clientes documento duplicado → 409", async () => {
		await request(app.getHttpServer())
			.post("/clientes")
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "X", documento: CPF_VALIDOS[1] });
		const res = await request(app.getHttpServer())
			.post("/clientes")
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "Y", documento: CPF_VALIDOS[1] });
		expect(res.status).toBe(409);
	});

	it("POST /clientes (mecânico) → 403", async () => {
		const res = await request(app.getHttpServer())
			.post("/clientes")
			.set("Authorization", bearer(mecanicoToken))
			.send({ nome: "Z", documento: CPF_VALIDOS[2] });
		expect(res.status).toBe(403);
	});

	it("GET /clientes (mecânico) → 200", async () => {
		const res = await request(app.getHttpServer()).get("/clientes").set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
	});

	it("GET /clientes/buscar?documento=… happy → 200", async () => {
		await createCliente(app, atendenteToken, { documento: CPF_VALIDOS[0] });
		const res = await request(app.getHttpServer())
			.get(`/clientes/buscar?documento=${CPF_VALIDOS[0]}`)
			.set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(200);
		expect(res.body.data.documento).toBe(CPF_VALIDOS[0]);
	});

	it("GET /clientes/buscar (mecânico) → 403", async () => {
		const res = await request(app.getHttpServer())
			.get(`/clientes/buscar?documento=${CPF_VALIDOS[0]}`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(403);
	});

	it("GET /clientes/:id inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.get(`/clientes/00000000-0000-4000-8000-000000000000`)
			.set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(404);
	});

	it("PATCH /clientes/:id happy → 200", async () => {
		const c = await createCliente(app, atendenteToken, { documento: CPF_VALIDOS[0] });
		const res = await request(app.getHttpServer())
			.patch(`/clientes/${c.id}`)
			.set("Authorization", bearer(atendenteToken))
			.send({ nome: "Renomeado" });
		expect(res.status).toBe(200);
		expect(res.body.data.nome).toBe("Renomeado");
	});

	it("PATCH /clientes/:id tentar alterar documento (whitelist) → 400", async () => {
		const c = await createCliente(app, atendenteToken, { documento: CPF_VALIDOS[0] });
		const res = await request(app.getHttpServer())
			.patch(`/clientes/${c.id}`)
			.set("Authorization", bearer(atendenteToken))
			.send({ documento: CPF_VALIDOS[1] });
		expect(res.status).toBe(400);
	});

	it("DELETE /clientes/:id (admin) sem OS → 200 soft-delete", async () => {
		const c = await createCliente(app, atendenteToken, { documento: CPF_VALIDOS[0] });
		const res = await request(app.getHttpServer()).delete(`/clientes/${c.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
		expect(res.body.data.ativo).toBe(false);
	});

	it("DELETE /clientes/:id com OS aberta → 409", async () => {
		const c = await createCliente(app, atendenteToken, { documento: CPF_VALIDOS[0] });
		const v = await createVeiculo(app, atendenteToken, c.id);
		await createOS(app, atendenteToken, c.id, v.id);

		const res = await request(app.getHttpServer()).delete(`/clientes/${c.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(409);
	});
});
