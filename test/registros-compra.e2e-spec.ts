import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";
import { createInsumo } from "./helpers/factories";

describe("Registros de Compra (e2e)", () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let estoquistaToken: string;
	let adminToken: string;

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
	});

	async function criarCompra(quantidade = 10): Promise<any> {
		const insumo = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 0 });
		const res = await request(app.getHttpServer())
			.post("/insumos/compras")
			.set("Authorization", bearer(estoquistaToken))
			.send({ insumoId: insumo.id, quantidadeSolicitada: quantidade });
		expect(res.status).toBe(201);
		return { insumo, compra: res.body.data };
	}

	it("POST /insumos/compras → 201, status CRIADO", async () => {
		const { compra } = await criarCompra();
		expect(compra.status).toBe("CRIADO");
	});

	it("POST /insumos/compras insumoId inválido → 404", async () => {
		const res = await request(app.getHttpServer())
			.post("/insumos/compras")
			.set("Authorization", bearer(estoquistaToken))
			.send({ insumoId: "00000000-0000-4000-8000-000000000000", quantidadeSolicitada: 1 });
		expect(res.status).toBe(404);
	});

	it("POST /insumos/compras ordemServicoId inválido → 404", async () => {
		const insumo = await createInsumo(app, estoquistaToken);
		const res = await request(app.getHttpServer()).post("/insumos/compras").set("Authorization", bearer(estoquistaToken)).send({
			insumoId: insumo.id,
			quantidadeSolicitada: 1,
			ordemServicoId: "00000000-0000-4000-8000-000000000000",
		});
		expect(res.status).toBe(404);
	});

	it("GET /insumos/compras → 200 lista", async () => {
		await criarCompra();
		const res = await request(app.getHttpServer()).get("/insumos/compras").set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.data)).toBe(true);
	});

	it("GET /insumos/compras/:id inexistente → 404", async () => {
		const res = await request(app.getHttpServer())
			.get("/insumos/compras/00000000-0000-4000-8000-000000000000")
			.set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(404);
	});

	it("POST /insumos/compras/:id/enviar-fornecedor qtd ≤ 50 → 200, APROVADO_FORNECEDOR", async () => {
		const { compra } = await criarCompra(10);
		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/enviar-fornecedor`)
			.set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("APROVADO_FORNECEDOR");
	});

	it("POST /insumos/compras/:id/enviar-fornecedor qtd > 50 → 200, RECUSADO_FORNECEDOR", async () => {
		const { compra } = await criarCompra(60);
		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/enviar-fornecedor`)
			.set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("RECUSADO_FORNECEDOR");
	});

	it("POST /insumos/compras/:id/enviar-fornecedor em status diferente de CRIADO → 422", async () => {
		const { compra } = await criarCompra(10);
		await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/enviar-fornecedor`)
			.set("Authorization", bearer(estoquistaToken));

		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/enviar-fornecedor`)
			.set("Authorization", bearer(estoquistaToken));
		expect(res.status).toBe(422);
	});

	it("POST /insumos/compras/:id/resposta-fornecedor aprovado=false sem motivo → 400", async () => {
		const { compra } = await criarCompra(10);
		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/resposta-fornecedor`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ aprovado: false });
		expect(res.status).toBe(400);
	});

	it("POST /insumos/compras/:id/resposta-fornecedor aprovado=true → 200", async () => {
		const { compra } = await criarCompra(10);
		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/resposta-fornecedor`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ aprovado: true, codigo: "APR", mensagem: "ok" });
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("APROVADO_FORNECEDOR");
	});

	it("POST /insumos/compras/:id/cancelar em CRIADO → 200, CANCELADO", async () => {
		const { compra } = await criarCompra(10);
		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/cancelar`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ motivo: "Não preciso mais" });
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("CANCELADO");
	});

	it("POST /insumos/compras/:id/cancelar em RECEBIDO → 422", async () => {
		const { compra } = await criarCompra(10);
		await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/enviar-fornecedor`)
			.set("Authorization", bearer(estoquistaToken));
		await request(app.getHttpServer()).post(`/insumos/compras/${compra.id}/receber`).set("Authorization", bearer(adminToken)).send({
			notaFiscalNumero: "NF-1",
			arquivoNome: "nf.pdf",
			arquivoTipo: "application/pdf",
			arquivoTamanho: 1024,
			arquivoUrl: "https://exemplo/nf.pdf",
		});

		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/cancelar`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ motivo: "tarde demais" });
		expect(res.status).toBe(422);
	});

	it("POST /insumos/compras/:id/receber em APROVADO → 200, estoque incrementa, MovimentoEstoque ENTRADA", async () => {
		const { insumo, compra } = await criarCompra(8);
		await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/enviar-fornecedor`)
			.set("Authorization", bearer(estoquistaToken));

		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/receber`)
			.set("Authorization", bearer(estoquistaToken))
			.send({
				notaFiscalNumero: "NF-100",
				arquivoNome: "nf.pdf",
				arquivoTipo: "application/pdf",
				arquivoTamanho: 1024,
				arquivoUrl: "https://exemplo/nf.pdf",
			});

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("RECEBIDO");

		const ins = await prisma.insumo.findUnique({ where: { id: insumo.id } });
		expect(ins!.quantidadeEstoque).toBe(8);

		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: insumo.id } });
		expect(movs.some((m) => m.tipo === "ENTRADA")).toBe(true);
	});

	it("POST /insumos/compras/:id/receber em CRIADO → 422", async () => {
		const { compra } = await criarCompra(10);
		const res = await request(app.getHttpServer())
			.post(`/insumos/compras/${compra.id}/receber`)
			.set("Authorization", bearer(estoquistaToken))
			.send({
				notaFiscalNumero: "NF-1",
				arquivoNome: "nf.pdf",
				arquivoTipo: "application/pdf",
				arquivoTamanho: 1024,
				arquivoUrl: "https://exemplo/nf.pdf",
			});
		expect(res.status).toBe(422);
	});
});
