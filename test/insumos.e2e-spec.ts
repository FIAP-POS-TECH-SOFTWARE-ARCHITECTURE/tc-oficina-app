import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";
import { createInsumo } from "./helpers/factories";

describe("Insumos (e2e)", () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let estoquistaToken: string;
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
		estoquistaToken = (await loginAs(app, prisma, Role.ESTOQUISTA)).token;
		adminToken = (await loginAs(app, prisma, Role.ADMINISTRADOR)).token;
		mecanicoToken = (await loginAs(app, prisma, Role.MECANICO)).token;
	});

	it("POST /insumos (estoquista) happy → 201", async () => {
		const res = await request(app.getHttpServer())
			.post("/insumos")
			.set("Authorization", bearer(estoquistaToken))
			.send({ codigo: "INS-1", nome: "Filtro", precoUnitario: 50, quantidadeEstoque: 10 });
		expect(res.status).toBe(201);
	});

	it("POST /insumos código duplicado → 409", async () => {
		await createInsumo(app, estoquistaToken, { codigo: "DUP-1" });
		const res = await request(app.getHttpServer())
			.post("/insumos")
			.set("Authorization", bearer(estoquistaToken))
			.send({ codigo: "DUP-1", nome: "X", precoUnitario: 10 });
		expect(res.status).toBe(409);
	});

	it("POST /insumos precoUnitario negativo → 400", async () => {
		const res = await request(app.getHttpServer())
			.post("/insumos")
			.set("Authorization", bearer(estoquistaToken))
			.send({ codigo: "NEG-1", nome: "Neg", precoUnitario: -1 });
		expect(res.status).toBe(400);
	});

	it("POST /insumos (mecânico) → 403", async () => {
		const res = await request(app.getHttpServer())
			.post("/insumos")
			.set("Authorization", bearer(mecanicoToken))
			.send({ codigo: "MEC-1", nome: "X", precoUnitario: 10 });
		expect(res.status).toBe(403);
	});

	it("GET /insumos qualquer autenticado → 200", async () => {
		const res = await request(app.getHttpServer()).get("/insumos").set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
	});

	it("GET /insumos/alertas/estoque-baixo (estoquista) → 200, retorna apenas com qtd ≤ mínimo", async () => {
		await createInsumo(app, estoquistaToken, { codigo: "OK", quantidadeEstoque: 100, estoqueMinimo: 5 });
		await createInsumo(app, estoquistaToken, { codigo: "BAIXO", quantidadeEstoque: 2, estoqueMinimo: 10 });

		const res = await request(app.getHttpServer()).get("/insumos/alertas/estoque-baixo").set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(200);
		const codigos = res.body.data.map((i: any) => i.codigo);
		expect(codigos).toContain("BAIXO");
		expect(codigos).not.toContain("OK");
	});

	it("GET /insumos/alertas/estoque-baixo (mecânico) → 403", async () => {
		const res = await request(app.getHttpServer()).get("/insumos/alertas/estoque-baixo").set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(403);
	});

	it("GET /insumos/:id inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.get("/insumos/00000000-0000-4000-8000-000000000000")
			.set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(404);
	});

	it("PATCH /insumos/:id tentativa de alterar codigo → 400", async () => {
		const i = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer())
			.patch(`/insumos/${i.id}`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ codigo: "OUTRO" });
		expect(res.status).toBe(400);
	});

	it("PATCH /insumos/:id (estoquista) → 200", async () => {
		const i = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer())
			.patch(`/insumos/${i.id}`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ nome: "Novo nome" });
		expect(res.status).toBe(200);
	});

	it("DELETE /insumos/:id (admin) → 200", async () => {
		const i = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer()).delete(`/insumos/${i.id}`).set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
	});

	it("POST /insumos/:id/entrada (estoquista) → 200, estoque incrementa, MovimentoEstoque ENTRADA", async () => {
		const i = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 10 });
		const res = await request(app.getHttpServer())
			.post(`/insumos/${i.id}/entrada`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ quantidade: 5, motivo: "Recompra" });
		expect(res.status).toBe(200);
		expect(res.body.data.quantidadeEstoque).toBe(15);

		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: i.id } });
		expect(movs).toHaveLength(1);
		expect(movs[0].tipo).toBe("ENTRADA");
		expect(movs[0].quantidade).toBe(5);
	});

	it("POST /insumos/:id/entrada quantidade ≤ 0 → 400", async () => {
		const i = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer())
			.post(`/insumos/${i.id}/entrada`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ quantidade: 0 });
		expect(res.status).toBe(400);
	});

	it("POST /insumos/:id/ajuste (admin) novaQuantidade=10 → 200, MovimentoEstoque AJUSTE", async () => {
		const i = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 50 });
		const res = await request(app.getHttpServer())
			.post(`/insumos/${i.id}/ajuste`)
			.set("Authorization", bearer(adminToken))
			.send({ novaQuantidade: 10, motivo: "Reconciliação" });
		expect(res.status).toBe(200);
		expect(res.body.data.quantidadeEstoque).toBe(10);

		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: i.id } });
		expect(movs[0].tipo).toBe("AJUSTE");
	});

	it("POST /insumos/:id/ajuste (admin) novaQuantidade negativa → 400", async () => {
		const i = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer())
			.post(`/insumos/${i.id}/ajuste`)
			.set("Authorization", bearer(adminToken))
			.send({ novaQuantidade: -1, motivo: "X" });
		expect(res.status).toBe(400);
	});

	it("POST /insumos/:id/ajuste (estoquista, sem ser admin) → 403", async () => {
		const i = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer())
			.post(`/insumos/${i.id}/ajuste`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ novaQuantidade: 5, motivo: "X" });
		expect(res.status).toBe(403);
	});

	it("GET /insumos/:id/movimentos → 200, lista entrada + ajuste", async () => {
		const i = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 10 });
		await request(app.getHttpServer())
			.post(`/insumos/${i.id}/entrada`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ quantidade: 5 });
		await request(app.getHttpServer())
			.post(`/insumos/${i.id}/ajuste`)
			.set("Authorization", bearer(adminToken))
			.send({ novaQuantidade: 20, motivo: "Ajuste" });

		const res = await request(app.getHttpServer()).get(`/insumos/${i.id}/movimentos`).set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(200);
		expect(res.body.data.length).toBeGreaterThanOrEqual(2);
	});
});
