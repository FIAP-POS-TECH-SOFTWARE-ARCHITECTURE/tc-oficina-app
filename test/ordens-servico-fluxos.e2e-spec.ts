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
} from "./helpers/factories";

describe("Ordens de Serviço (e2e) — fluxos cross-módulo", () => {
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

	async function setupBaseOS(opts: { quantidadeEstoque?: number; documento?: string } = {}) {
		const cliente = await createCliente(app, atendenteToken, {
			documento: opts.documento ?? CPF_VALIDOS[0],
		});
		const veiculo = await createVeiculo(app, atendenteToken, cliente.id);
		const servico = await createServico(app, adminToken, { preco: 100 });
		const insumo = await createInsumo(app, estoquistaToken, {
			quantidadeEstoque: opts.quantidadeEstoque ?? 100,
			precoUnitario: 20,
		});
		const os = await createOS(app, atendenteToken, cliente.id, veiculo.id);
		return { cliente, veiculo, servico, insumo, os };
	}

	async function adicionarItensEAprovar(os: any, servicoId: string, insumoId: string, documento: string, qtdInsumo = 5) {
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId, quantidade: 1 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId, quantidade: qtdInsumo });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		const aprov = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento });
		return aprov;
	}

	it("smoke completo: cliente → veículo → OS → diagnóstico → orçamento → aprovação → execução → finalização → entrega → consulta pública", async () => {
		const { cliente, veiculo, servico, insumo, os } = await setupBaseOS();

		// diagnóstico
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.patch(`/os/${os.id}/diagnostico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ diagnostico: "Troca preventiva" });

		// itens
		const addServico = await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: servico.id, quantidade: 1 });
		expect(addServico.status).toBe(201);
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 3 });

		// orçamento + aprovação
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		const aprov = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });
		expect(aprov.status).toBe(200);
		expect(aprov.body.data.status).toBe("EM_EXECUCAO");

		// estoque baixou
		const ins = await prisma.insumo.findUnique({ where: { id: insumo.id } });
		expect(ins!.quantidadeEstoque).toBe(97);
		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: insumo.id } });
		expect(movs.some((m) => m.tipo === "SAIDA")).toBe(true);

		// executar item de serviço
		const itemId = aprov.body.data.itensServico[0].id;
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/concluir`)
			.set("Authorization", bearer(mecanicoToken));

		// finalizar
		const fim = await request(app.getHttpServer())
			.post(`/os/${os.id}/finalizar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(fim.status).toBe(200);
		expect(fim.body.data.status).toBe("FINALIZADA");

		// entregar
		const entr = await request(app.getHttpServer())
			.post(`/os/${os.id}/entregar`)
			.set("Authorization", bearer(atendenteToken));
		expect(entr.status).toBe(200);
		expect(entr.body.data.status).toBe("ENTREGUE");

		// consulta pública
		const pub = await request(app.getHttpServer()).get(
			`/os/publica/${os.numero}?documento=${cliente.documento}`,
		);
		expect(pub.status).toBe(200);
		expect(pub.body.data.numero).toBe(os.numero);
		expect(pub.body.data.veiculo.placa).toBe(veiculo.placa);
	});

	it("BLOQUEADA → tentar desbloquear sem repor estoque → 422", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS({ quantidadeEstoque: 5 });
		// reduz estoque do insumo para 0 antes de aprovar
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: servico.id, quantidade: 1 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 5 });
		// zera o estoque via ajuste antes de aprovar
		await request(app.getHttpServer())
			.post(`/insumos/${insumo.id}/ajuste`)
			.set("Authorization", bearer(adminToken))
			.send({ novaQuantidade: 0, motivo: "Quebra" });

		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		const aprov = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });
		expect(aprov.body.data.status).toBe("BLOQUEADA");

		const desbl = await request(app.getHttpServer())
			.post(`/os/${os.id}/desbloquear`)
			.set("Authorization", bearer(atendenteToken))
			.send({});
		expect(desbl.status).toBe(422);
	});

	it("BLOQUEADA → repor estoque via entrada → desbloqueia → EM_EXECUCAO", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS({ quantidadeEstoque: 5 });

		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: servico.id, quantidade: 1 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 5 });
		await request(app.getHttpServer())
			.post(`/insumos/${insumo.id}/ajuste`)
			.set("Authorization", bearer(adminToken))
			.send({ novaQuantidade: 0, motivo: "Quebra" });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });

		// repõe estoque
		await request(app.getHttpServer())
			.post(`/insumos/${insumo.id}/entrada`)
			.set("Authorization", bearer(estoquistaToken))
			.send({ quantidade: 10 });

		const desbl = await request(app.getHttpServer())
			.post(`/os/${os.id}/desbloquear`)
			.set("Authorization", bearer(atendenteToken))
			.send({});
		expect(desbl.status).toBe(200);
		expect(desbl.body.data.status).toBe("EM_EXECUCAO");
	});

	it("Cancelamento com estorno: aprovar (estoque baixa) → cancelar → estoque volta + ESTORNO", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS();
		await adicionarItensEAprovar(os, servico.id, insumo.id, cliente.documento, 5);

		const insAfter = await prisma.insumo.findUnique({ where: { id: insumo.id } });
		expect(insAfter!.quantidadeEstoque).toBe(95);

		const cancel = await request(app.getHttpServer())
			.post(`/os/${os.id}/cancelar`)
			.set("Authorization", bearer(adminToken))
			.send({ motivo: "Cliente desistiu" });
		expect(cancel.status).toBe(200);

		const insRestored = await prisma.insumo.findUnique({ where: { id: insumo.id } });
		expect(insRestored!.quantidadeEstoque).toBe(100);

		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: insumo.id } });
		expect(movs.some((m) => m.tipo === "ESTORNO")).toBe(true);
	});

	it("Cancelar OS em RECEBIDA (sem aprovação) → não estorna nada", async () => {
		const { insumo, os } = await setupBaseOS();
		const stockBefore = (await prisma.insumo.findUnique({ where: { id: insumo.id } }))!.quantidadeEstoque;

		const cancel = await request(app.getHttpServer())
			.post(`/os/${os.id}/cancelar`)
			.set("Authorization", bearer(adminToken))
			.send({ motivo: "X" });
		expect(cancel.status).toBe(200);

		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: insumo.id } });
		expect(movs.filter((m) => m.tipo === "ESTORNO")).toHaveLength(0);
		const stockAfter = (await prisma.insumo.findUnique({ where: { id: insumo.id } }))!.quantidadeEstoque;
		expect(stockAfter).toBe(stockBefore);
	});

	it("Cancelar OS em ENTREGUE → 422", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS();
		await adicionarItensEAprovar(os, servico.id, insumo.id, cliente.documento, 1);
		const itemId = (
			await prisma.osItemServico.findFirst({ where: { ordemServicoId: os.id } })
		)!.id;
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${itemId}/concluir`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/finalizar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/entregar`)
			.set("Authorization", bearer(atendenteToken));

		const cancel = await request(app.getHttpServer())
			.post(`/os/${os.id}/cancelar`)
			.set("Authorization", bearer(adminToken))
			.send({ motivo: "tarde" });
		expect(cancel.status).toBe(422);
	});

	it("FIXME: cancelar OS em BLOQUEADA gera estorno mesmo sem baixa real (estoque fantasma)", async () => {
		// FIXME: comportamento atual gera estoque fantasma quando OS é BLOQUEADA.
		//        Issue separada deve ajustar o gatilho do estorno (ex: campo `estoqueBaixado` ou checar status).
		//        Quando o fix sair, este teste precisa virar "não estorna se OS estava BLOQUEADA".
		const { cliente, servico, insumo, os } = await setupBaseOS({ quantidadeEstoque: 5 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: servico.id, quantidade: 1 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-insumo`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ insumoId: insumo.id, quantidade: 5 });
		await request(app.getHttpServer())
			.post(`/insumos/${insumo.id}/ajuste`)
			.set("Authorization", bearer(adminToken))
			.send({ novaQuantidade: 0, motivo: "Quebra" });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });

		const before = (await prisma.insumo.findUnique({ where: { id: insumo.id } }))!.quantidadeEstoque;
		const cancel = await request(app.getHttpServer())
			.post(`/os/${os.id}/cancelar`)
			.set("Authorization", bearer(adminToken))
			.send({ motivo: "BLOQUEADA cancelada" });
		expect(cancel.status).toBe(200);

		const after = (await prisma.insumo.findUnique({ where: { id: insumo.id } }))!.quantidadeEstoque;
		// comportamento atual: estorno gera estoque fantasma
		expect(after).toBe(before + 5);
		const movs = await prisma.movimentoEstoque.findMany({ where: { insumoId: insumo.id } });
		expect(movs.some((m) => m.tipo === "ESTORNO")).toBe(true);
	});

	it("Finalizar com itens pendentes → 422", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS();
		await adicionarItensEAprovar(os, servico.id, insumo.id, cliente.documento, 1);

		const fim = await request(app.getHttpServer())
			.post(`/os/${os.id}/finalizar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(fim.status).toBe(422);
	});

	it("Finalizar com todos itens CONCLUIDO → 200", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS();
		await adicionarItensEAprovar(os, servico.id, insumo.id, cliente.documento, 1);
		const item = (await prisma.osItemServico.findFirst({ where: { ordemServicoId: os.id } }))!;
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${item.id}/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico/${item.id}/concluir`)
			.set("Authorization", bearer(mecanicoToken));

		const fim = await request(app.getHttpServer())
			.post(`/os/${os.id}/finalizar`)
			.set("Authorization", bearer(mecanicoToken));
		expect(fim.status).toBe(200);
	});

	it("Aprovação pública com documento correto → EM_EXECUCAO", async () => {
		const { cliente, servico, insumo, os } = await setupBaseOS();
		const r = await adicionarItensEAprovar(os, servico.id, insumo.id, cliente.documento, 1);
		expect(r.status).toBe(200);
		expect(r.body.data.status).toBe("EM_EXECUCAO");
	});

	it("Rejeição pública com documento correto → CANCELADA", async () => {
		const { cliente, servico, os } = await setupBaseOS();
		await request(app.getHttpServer())
			.post(`/os/${os.id}/diagnostico/iniciar`)
			.set("Authorization", bearer(mecanicoToken));
		await request(app.getHttpServer())
			.post(`/os/${os.id}/itens-servico`)
			.set("Authorization", bearer(mecanicoToken))
			.send({ servicoId: servico.id, quantidade: 1 });
		await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/gerar`)
			.set("Authorization", bearer(mecanicoToken));

		const rej = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/rejeitar`)
			.send({ documento: cliente.documento });
		expect(rej.status).toBe(200);
		expect(rej.body.data.status).toBe("CANCELADA");
	});

	it("Aprovação fora de AGUARDANDO_APROVACAO → 422", async () => {
		const { cliente, os } = await setupBaseOS();
		const aprov = await request(app.getHttpServer())
			.post(`/os/${os.id}/orcamento/aprovar`)
			.send({ documento: cliente.documento });
		expect(aprov.status).toBe(422);
	});
});
