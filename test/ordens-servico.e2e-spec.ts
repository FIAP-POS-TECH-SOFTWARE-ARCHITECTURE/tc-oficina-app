import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { bearer, loginAs } from "./helpers/auth";
import { truncateAll } from "./helpers/db";
import {
	CPF_VALIDOS,
	createCliente,
	createInsumo,
	createOS,
	createServico,
	createVeiculo,
	nextPlaca,
} from "./helpers/factories";

describe("Ordens de Serviço (e2e) — endpoints individuais", () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let atendenteToken: string;
	let adminToken: string;
	let mecanicoToken: string;
	let estoquistaToken: string;

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
		estoquistaToken = (await loginAs(app, prisma, Role.ESTOQUISTA)).token;
	});

	async function setupClienteVeiculo(documento = CPF_VALIDOS[0]) {
		const cliente = await createCliente(app, atendenteToken, { documento });
		const veiculo = await createVeiculo(app, atendenteToken, cliente.id);
		return { cliente, veiculo };
	}

	it("POST /os (atendente) happy → 201, status RECEBIDA, número OS-YYYY-XXXXXX", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const res = await request(app.getHttpServer())
			.post("/os")
			.set("Authorization", bearer(atendenteToken))
			.send({ clienteId: cliente.id, veiculoId: veiculo.id });
		expect(res.status).toBe(201);
		expect(res.body.data.status).toBe("RECEBIDA");
		expect(res.body.data.numero).toMatch(/^OS-\d{4}-\d{6}$/);
	});

	it("POST /os cliente inexistente → 404", async () => {
		const { veiculo } = await setupClienteVeiculo();
		const res = await request(app.getHttpServer())
			.post("/os")
			.set("Authorization", bearer(atendenteToken))
			.send({ clienteId: "00000000-0000-4000-8000-000000000000", veiculoId: veiculo.id });
		expect(res.status).toBe(404);
	});

	it("POST /os veículo de outro cliente → 400", async () => {
		const { cliente: c1 } = await setupClienteVeiculo(CPF_VALIDOS[0]);
		const c2 = await createCliente(app, atendenteToken, { documento: CPF_VALIDOS[1] });
		const v2 = await createVeiculo(app, atendenteToken, c2.id, { placa: nextPlaca() });

		const res = await request(app.getHttpServer())
			.post("/os")
			.set("Authorization", bearer(atendenteToken))
			.send({ clienteId: c1.id, veiculoId: v2.id });
		expect(res.status).toBe(400);
	});

	it("POST /os (mecânico) → 403", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const res = await request(app.getHttpServer())
			.post("/os")
			.set("Authorization", bearer(mecanicoToken))
			.send({ clienteId: cliente.id, veiculoId: veiculo.id });
		expect(res.status).toBe(403);
	});

	it("GET /os com filtros (status, page, pageSize) → 200, paginação correta", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer())
			.get("/os?status=RECEBIDA&page=1&pageSize=10")
			.set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({ page: 1, pageSize: 10 });
		expect(Array.isArray(res.body.data.items)).toBe(true);
	});

	it("GET /os/metricas/tempo-medio (admin) → 200", async () => {
		const res = await request(app.getHttpServer())
			.get("/os/metricas/tempo-medio")
			.set("Authorization", bearer(adminToken));
		expect(res.status).toBe(200);
	});

	it("GET /os/metricas/tempo-medio (atendente) → 403", async () => {
		const res = await request(app.getHttpServer())
			.get("/os/metricas/tempo-medio")
			.set("Authorization", bearer(atendenteToken));
		expect(res.status).toBe(403);
	});

	it("GET /os/publica/:numero?documento=… happy (sem token) → 200, sem dados sensíveis", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer()).get(
			`/os/publica/${os.numero}?documento=${cliente.documento}`,
		);
		expect(res.status).toBe(200);
		expect(res.body.data.numero).toBe(os.numero);
		expect(res.body.data.cliente).not.toBe(cliente.nome);
	});

	it("GET /os/publica/:numero documento errado → 403", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo(CPF_VALIDOS[0]);
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer()).get(
			`/os/publica/${os.numero}?documento=${CPF_VALIDOS[1]}`,
		);
		expect(res.status).toBe(403);
	});

	it("GET /os/publica/:numero número inexistente → 404", async () => {
		const res = await request(app.getHttpServer()).get(`/os/publica/OS-9999-999999?documento=${CPF_VALIDOS[0]}`);
		expect(res.status).toBe(404);
	});

	it("GET /os/:id (mecânico) → 200", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer())
			.get(`/os/${os.id}`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
	});

	it("POST /os/:id/diagnostico/iniciar (mecânico) RECEBIDA → 200, EM_DIAGNOSTICO", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("EM_DIAGNOSTICO");
	});

	it("POST /os/:id/diagnostico/iniciar em EM_DIAGNOSTICO → 422", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(422);
	});

	it("PATCH /os/:id/diagnostico em EM_DIAGNOSTICO → 200", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const res = await request(app.getHttpServer())
			.patch(`/os/${os.id}/diagnostico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ diagnostico: "Pastilha desgastada" });
		expect(res.status).toBe(200);
	});

	it("PATCH /os/:id/diagnostico em RECEBIDA → 422", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer())
			.patch(`/os/${os.id}/diagnostico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ diagnostico: "X" });
		expect(res.status).toBe(422);
	});

	it("POST /os/:id/itens-servico em RECEBIDA → 201", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken);
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 1 });
		expect(res.status).toBe(201);
	});

	it("POST /os/:id/itens-servico em AGUARDANDO_APROVACAO → 422", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 1 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));

		const s2 = await createServico(app, adminToken);
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s2.id, quantidade: 1 });
		expect(res.status).toBe(422);
	});

	it("DELETE /os/:id/itens-servico/:itemId → 200", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken);
		const add = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 1 });
		const itemId = add.body.data.itensServico[0].id;

		const res = await request(app.getHttpServer())
			.delete(`/os/${os.id}/itens-servico/${itemId}`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
	});

	it("POST /os/:id/itens-insumo com estoque suficiente → 201", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const insumo = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 100 });
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 5 });
		expect(res.status).toBe(201);
	});

	it("POST /os/:id/itens-insumo com estoque insuficiente → 422", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const insumo = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 1 });
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 100 });
		expect(res.status).toBe(422);
	});

	it("DELETE /os/:id/itens-insumo/:itemId → 200", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const insumo = await createInsumo(app, estoquistaToken, { quantidadeEstoque: 100 });
		const add = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 2 });
		const itemId = add.body.data.itensInsumo[0].id;

		const res = await request(app.getHttpServer())
			.delete(`/os/${os.id}/itens-insumo/${itemId}`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
	});

	it("POST /os/:id/orcamento/gerar sem itens de serviço → 422", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(422);
	});

	it("POST /os/:id/orcamento/gerar com serviços → 200, AGUARDANDO_APROVACAO, valorTotal correto", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken, { preco: 100 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 2 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("AGUARDANDO_APROVACAO");
		expect(Number(res.body.data.valorTotal)).toBe(200);
	});

	it("POST /os/:id/orcamento/aprovar documento errado → 403", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo(CPF_VALIDOS[0]);
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: CPF_VALIDOS[1] });
		expect(res.status).toBe(403);
	});

	it("POST /os/:id/orcamento/rejeitar documento errado → 403", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo(CPF_VALIDOS[0]);
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/rejeitar`)
			.send({ documento: CPF_VALIDOS[1] });
		expect(res.status).toBe(403);
	});

	it("POST /os/:id/itens-servico/:itemId/iniciar (em EM_EXECUCAO) → 200, item EM_EXECUCAO", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const add = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 1 });
		const itemId = add.body.data.itensServico[0].id;
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });

		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
		const item = res.body.data.itensServico.find((i: any) => i.id === itemId);
		expect(item.status).toBe("EM_EXECUCAO");
	});

	it("POST /os/:id/itens-servico/:itemId/concluir → 200, item CONCLUIDO", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const add = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 1 });
		const itemId = add.body.data.itensServico[0].id;
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/iniciar`)
			.set("Authorization", bearer(mecanicoToken));

		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/concluir`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(200);
		const item = res.body.data.itensServico.find((i: any) => i.id === itemId);
		expect(item.status).toBe("CONCLUIDO");
	});

	it("POST /os/:id/itens-servico/:itemId/cancelar em CONCLUIDO → 422", async () => {
		const { cliente, veiculo } = await setupClienteVeiculo();
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		const s = await createServico(app, adminToken);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		const add = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: s.id, quantidade: 1 });
		const itemId = add.body.data.itensServico[0].id;
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/concluir`)
			.set("Authorization", bearer(mecanicoToken));

		const res = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/cancelar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(res.status).toBe(422);
	});
});
