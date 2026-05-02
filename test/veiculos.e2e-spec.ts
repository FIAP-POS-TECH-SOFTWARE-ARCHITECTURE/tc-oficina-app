import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";
import { createCliente, createOS, createVeiculo, PLACAS_VALIDAS } from "./helpers/factories";

describe("Veiculos (e2e)", () => {
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

	it("POST /clientes/:cId/veiculos happy → 201", async () => {
		const c = await createCliente(app, atendenteToken);
		const res = await request(app.getHttpServer())
			.post(`/clientes/${c.id}/veiculos`)
			.set("Authorization", bearer(atendenteToken))
			.send({ placa: PLACAS_VALIDAS[0], marca: "Fiat", modelo: "Uno", ano: 2020 });
		expect(res.status).toBe(201);
	});

	it("POST /clientes/:cId/veiculos cliente inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.post(`/clientes/00000000-0000-4000-8000-000000000000/veiculos`)
			.set("Authorization", bearer(atendenteToken))
			.send({ placa: PLACAS_VALIDAS[1], marca: "Fiat", modelo: "Uno", ano: 2020 });
		expect(res.status).toBe(404);
	});

	it("POST /clientes/:cId/veiculos placa duplicada → 409", async () => {
		const c = await createCliente(app, atendenteToken);
		await createVeiculo(app, atendenteToken, c.id, { placa: PLACAS_VALIDAS[2] });
		const c2 = await createCliente(app, atendenteToken);
		const res = await request(app.getHttpServer())
			.post(`/clientes/${c2.id}/veiculos`)
			.set("Authorization", bearer(atendenteToken))
			.send({ placa: PLACAS_VALIDAS[2], marca: "Fiat", modelo: "Uno", ano: 2020 });
		expect(res.status).toBe(409);
	});

	it("POST /clientes/:cId/veiculos placa inválida → 400", async () => {
		const c = await createCliente(app, atendenteToken);
		const res = await request(app.getHttpServer())
			.post(`/clientes/${c.id}/veiculos`)
			.set("Authorization", bearer(atendenteToken))
			.send({ placa: "INVALIDA!", marca: "Fiat", modelo: "Uno", ano: 2020 });
		expect(res.status).toBe(400);
	});

	it("POST /clientes/:cId/veiculos ano fora 1900-2100 → 400", async () => {
		const c = await createCliente(app, atendenteToken);
		const res = await request(app.getHttpServer())
			.post(`/clientes/${c.id}/veiculos`)
			.set("Authorization", bearer(atendenteToken))
			.send({ placa: PLACAS_VALIDAS[3], marca: "Fiat", modelo: "Uno", ano: 1800 });
		expect(res.status).toBe(400);
	});

	it("GET /clientes/:cId/veiculos (mecânico) → 200", async () => {
		const c = await createCliente(app, atendenteToken);
		await createVeiculo(app, atendenteToken, c.id);
		const res = await request(app.getHttpServer()).get(`/clientes/${c.id}/veiculos`).set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
	});

	it("GET /veiculos/buscar?placa=… happy → 200", async () => {
		const c = await createCliente(app, atendenteToken);
		const v = await createVeiculo(app, atendenteToken, c.id, { placa: "ABC1234" });
		const res = await request(app.getHttpServer()).get(`/veiculos/buscar?placa=ABC1234`).set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(200);
		expect(res.body.data.id).toBe(v.id);
	});

	it("GET /veiculos/:id inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.get(`/veiculos/00000000-0000-4000-8000-000000000000`)
			.set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(404);
	});

	it("PATCH /veiculos/:id happy (atendente) → 200", async () => {
		const c = await createCliente(app, atendenteToken);
		const v = await createVeiculo(app, atendenteToken, c.id);
		const res = await request(app.getHttpServer())
			.patch(`/veiculos/${v.id}`)
			.set("Authorization", bearer(atendenteToken))
			.send({ marca: "Volkswagen" });
		expect(res.status).toBe(200);
	});

	it("PATCH /veiculos/:id tentar alterar placa → 400 (whitelist)", async () => {
		const c = await createCliente(app, atendenteToken);
		const v = await createVeiculo(app, atendenteToken, c.id);
		const res = await request(app.getHttpServer())
			.patch(`/veiculos/${v.id}`)
			.set("Authorization", bearer(atendenteToken))
			.send({ placa: "XYZ9876" });
		expect(res.status).toBe(400);
	});

	it("DELETE /veiculos/:id (admin) sem OS → 200", async () => {
		const c = await createCliente(app, atendenteToken);
		const v = await createVeiculo(app, atendenteToken, c.id);
		const res = await request(app.getHttpServer()).delete(`/veiculos/${v.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
	});

	it("DELETE /veiculos/:id com OS aberta → 409", async () => {
		const c = await createCliente(app, atendenteToken);
		const v = await createVeiculo(app, atendenteToken, c.id);
		await createOS(app, atendenteToken, c.id, v.id);
		const res = await request(app.getHttpServer()).delete(`/veiculos/${v.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(409);
	});
});
