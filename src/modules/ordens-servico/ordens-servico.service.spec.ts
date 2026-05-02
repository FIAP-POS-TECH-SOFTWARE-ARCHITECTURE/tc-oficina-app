import { OsItemServicoStatus, OsStatus, Prisma, TipoMovimentoEstoque } from "@prisma/client";
import { ClientesRepository } from "../clientes/clientes.repository";
import { InsumosRepository } from "../insumos/insumos.repository";
import { ServicosRepository } from "../servicos/servicos.repository";
import { VeiculosRepository } from "../veiculos/veiculos.repository";
import { OrdensServicoRepository } from "./ordens-servico.repository";
import { OrdensServicoService } from "./ordens-servico.service";

const D = (n: number | string) => new Prisma.Decimal(n);

const baseTx = () => ({
	ordemServico: { create: jest.fn(), update: jest.fn() },
	osHistoricoStatus: { create: jest.fn() },
	osItemServico: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
	osItemInsumo: { create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
	insumo: { update: jest.fn(), findUnique: jest.fn() },
	movimentoEstoque: { create: jest.fn() },
});

describe("OrdensServicoService", () => {
	let repo: jest.Mocked<OrdensServicoRepository>;
	let prisma: any;
	let clientes: jest.Mocked<ClientesRepository>;
	let veiculos: jest.Mocked<VeiculosRepository>;
	let servicos: jest.Mocked<ServicosRepository>;
	let insumos: jest.Mocked<InsumosRepository>;
	let service: OrdensServicoService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByIdFull: jest.fn(),
			findByNumero: jest.fn(),
			list: jest.fn(),
			tempoMedioPorMes: jest.fn(),
			contadorAno: jest.fn().mockResolvedValue(0),
			findHistorico: jest.fn(),
		} as unknown as jest.Mocked<OrdensServicoRepository>;
		prisma = {
			$transaction: jest.fn(async (fn: any) => fn(baseTx())),
			ordemServico: { update: jest.fn() },
			osItemServico: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn() },
			osItemInsumo: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
		};
		clientes = { findById: jest.fn() } as unknown as jest.Mocked<ClientesRepository>;
		veiculos = { findById: jest.fn() } as unknown as jest.Mocked<VeiculosRepository>;
		servicos = { findById: jest.fn() } as unknown as jest.Mocked<ServicosRepository>;
		insumos = { findById: jest.fn() } as unknown as jest.Mocked<InsumosRepository>;
		service = new OrdensServicoService(repo, prisma, clientes, veiculos, servicos, insumos);
	});

	describe("create", () => {
		it("404 quando cliente não existe", async () => {
			clientes.findById.mockResolvedValueOnce(null);
			const r = await service.create({ clienteId: "c1", veiculoId: "v1" });
			expect(r.status).toBe(404);
		});

		it("400 quando veículo não pertence ao cliente", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1" } as any);
			veiculos.findById.mockResolvedValueOnce({ id: "v1", clienteId: "outro" } as any);
			const r = await service.create({ clienteId: "c1", veiculoId: "v1" });
			expect(r.status).toBe(400);
		});

		it("422 quando cliente inativo", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1", ativo: false } as any);
			const r = await service.create({ clienteId: "c1", veiculoId: "v1" });
			expect(r.status).toBe(422);
		});

		it("422 quando veículo inativo", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1", ativo: true } as any);
			veiculos.findById.mockResolvedValueOnce({ id: "v1", clienteId: "c1", ativo: false } as any);
			const r = await service.create({ clienteId: "c1", veiculoId: "v1" });
			expect(r.status).toBe(422);
		});

		it("201 cria OS com número OS-YYYY-000001", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1" } as any);
			veiculos.findById.mockResolvedValueOnce({ id: "v1", clienteId: "c1" } as any);
			repo.contadorAno.mockResolvedValueOnce(0);
			repo.findByIdFull.mockResolvedValueOnce({ id: "os1" } as any);
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.ordemServico.create.mockResolvedValueOnce({ id: "os1", numero: "OS-2026-000001" });
				return fn(tx);
			});
			const r = await service.create({ clienteId: "c1", veiculoId: "v1" });
			expect(r.status).toBe(201);
		});
	});

	describe("addItemInsumo", () => {
		it("422 se estoque insuficiente", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			insumos.findById.mockResolvedValueOnce({
				id: "i1",
				quantidadeEstoque: 1,
				precoUnitario: D(10),
			} as any);
			const r = await service.addItemInsumo("os1", { insumoId: "i1", quantidade: 5 });
			expect(r.status).toBe(422);
		});

		it("201 quando estoque suficiente", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			insumos.findById.mockResolvedValueOnce({
				id: "i1",
				quantidadeEstoque: 10,
				precoUnitario: D(10),
			} as any);
			prisma.osItemInsumo.create.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.addItemInsumo("os1", { insumoId: "i1", quantidade: 5 });
			expect(r.status).toBe(201);
		});

		it("422 quando OS está em status que não permite adicionar item", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.AGUARDANDO_APROVACAO } as any);
			const r = await service.addItemInsumo("os1", { insumoId: "i1", quantidade: 1 });
			expect(r.status).toBe(422);
		});
	});

	describe("aprovarOrcamento", () => {
		const osMock = (overrides: any = {}) => ({
			id: "os1",
			status: OsStatus.AGUARDANDO_APROVACAO,
			cliente: { id: "c1", documento: "52998224725", nome: "Fulano" },
			itensServico: [],
			itensInsumo: [{ id: "ii1", insumoId: "i1", quantidade: 2 }],
			...overrides,
		});

		it("403 quando documento não confere", async () => {
			repo.findByIdFull.mockResolvedValueOnce(osMock());
			const r = await service.aprovarOrcamento("os1", { documento: "11111111111" });
			expect(r.status).toBe(403);
		});

		it("422 quando status não é AGUARDANDO_APROVACAO", async () => {
			repo.findByIdFull.mockResolvedValueOnce(osMock({ status: OsStatus.EM_EXECUCAO }));
			const r = await service.aprovarOrcamento("os1", { documento: "52998224725" });
			expect(r.status).toBe(422);
		});

		it("aprova e baixa estoque criando movimento SAIDA", async () => {
			repo.findByIdFull.mockResolvedValueOnce(osMock()).mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			const movs: any[] = [];
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce({
					id: "i1",
					nome: "Filtro",
					codigo: "P-001",
					quantidadeEstoque: 10,
					estoqueMinimo: 1,
				});
				tx.movimentoEstoque.create.mockImplementation((arg: any) => {
					movs.push(arg.data);
					return arg.data;
				});
				return fn(tx);
			});
			const r = await service.aprovarOrcamento("os1", { documento: "52998224725" });
			expect(r.status).toBe(200);
			expect(movs[0]).toMatchObject({
				tipo: TipoMovimentoEstoque.SAIDA,
				quantidade: 2,
				quantidadeAnterior: 10,
				quantidadePosterior: 8,
			});
		});

		it("bloqueia OS quando cliente aprova mas falta estoque", async () => {
			repo.findByIdFull.mockResolvedValueOnce(osMock()).mockResolvedValueOnce({ id: "os1", status: OsStatus.BLOQUEADA } as any);
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce({
					id: "i1",
					nome: "Filtro",
					codigo: "P-001",
					quantidadeEstoque: 1,
					estoqueMinimo: 1,
				});
				return fn(tx);
			});
			const r = await service.aprovarOrcamento("os1", { documento: "52998224725" });
			expect(r.status).toBe(200);
			expect(r.message).toContain("bloqueada");
		});
	});

	describe("desbloquear", () => {
		it("422 quando OS não está bloqueada", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.EM_EXECUCAO,
				itensInsumo: [],
			} as any);
			const r = await service.desbloquear("os1", "u1", {});
			expect(r.status).toBe(422);
		});

		it("422 quando segue sem estoque suficiente", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.BLOQUEADA,
				itensInsumo: [{ id: "ii1", insumoId: "i1", quantidade: 5 }],
			} as any);
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce({
					id: "i1",
					nome: "Filtro",
					codigo: "P-001",
					quantidadeEstoque: 1,
					estoqueMinimo: 0,
				});
				return fn(tx);
			});
			const r = await service.desbloquear("os1", "u1", {});
			expect(r.status).toBe(422);
		});

		it("200 quando há estoque e realiza baixa ao desbloquear", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.BLOQUEADA,
					iniciadoExecucaoEm: null,
					itensInsumo: [{ id: "ii1", insumoId: "i1", quantidade: 2 }],
				} as any)
				.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			const movs: any[] = [];
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce({
					id: "i1",
					nome: "Filtro",
					codigo: "P-001",
					quantidadeEstoque: 10,
					estoqueMinimo: 1,
				});
				tx.movimentoEstoque.create.mockImplementation((arg: any) => {
					movs.push(arg.data);
					return arg.data;
				});
				return fn(tx);
			});
			const r = await service.desbloquear("os1", "u1", {});
			expect(r.status).toBe(200);
			expect(movs[0]).toMatchObject({
				tipo: TipoMovimentoEstoque.SAIDA,
				quantidadeAnterior: 10,
				quantidadePosterior: 8,
			});
		});
	});

	describe("cancelar", () => {
		it("422 quando OS já entregue", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.ENTREGUE,
				itensInsumo: [],
			} as any);
			const r = await service.cancelar("os1", "u1", { motivo: "x" });
			expect(r.status).toBe(422);
		});

		it("estorna estoque quando OS aprovada é cancelada", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.EM_EXECUCAO,
					aprovadoEm: new Date(),
					itensInsumo: [{ id: "ii1", insumoId: "i1", quantidade: 3 }],
				} as any)
				.mockResolvedValueOnce({ id: "os1", status: OsStatus.CANCELADA } as any);
			const movs: any[] = [];
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 5 });
				tx.movimentoEstoque.create.mockImplementation((arg: any) => {
					movs.push(arg.data);
					return arg.data;
				});
				return fn(tx);
			});
			const r = await service.cancelar("os1", "u1", { motivo: "test" });
			expect(r.status).toBe(200);
			expect(movs[0]).toMatchObject({
				tipo: TipoMovimentoEstoque.ESTORNO,
				quantidade: 3,
				quantidadeAnterior: 5,
				quantidadePosterior: 8,
			});
		});
	});

	describe("findById/list/metricas", () => {
		it("findById 404", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.findById("x")).status).toBe(404);
		});

		it("findById 200", async () => {
			repo.findByIdFull.mockResolvedValueOnce({ id: "x" } as any);
			expect((await service.findById("x")).status).toBe(200);
		});

		it("list paginação default", async () => {
			repo.list.mockResolvedValueOnce([0, []] as any);
			const r = await service.list({});
			expect(r.status).toBe(200);
			expect((r.data as any).page).toBe(1);
			expect((r.data as any).pageSize).toBe(20);
		});

		it("metricas retorna agregado", async () => {
			repo.tempoMedioPorMes.mockResolvedValueOnce([{ ano_mes: "2026-04", tempo_medio_min: 60, total: 2 }]);
			const r = await service.tempoMedioExecucao();
			expect(r.status).toBe(200);
		});
	});

	describe("transições simples", () => {
		it("iniciarDiagnostico 422 se status errado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			const r = await service.iniciarDiagnostico("os1", "u1");
			expect(r.status).toBe(422);
		});

		it("iniciarDiagnostico 200 quando RECEBIDA", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.RECEBIDA } as any);
			repo.findByIdFull.mockResolvedValueOnce({ id: "os1" } as any);
			const r = await service.iniciarDiagnostico("os1", "u1");
			expect(r.status).toBe(200);
		});

		it("finalizar 422 quando ainda há serviço pendente", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.EM_EXECUCAO,
				itensServico: [{ status: OsItemServicoStatus.PENDENTE }],
			} as any);
			const r = await service.finalizar("os1", "u1");
			expect(r.status).toBe(422);
		});

		it("finalizar 200 quando todos serviços estão concluídos/cancelados", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.EM_EXECUCAO,
					itensServico: [{ status: OsItemServicoStatus.CONCLUIDO }, { status: OsItemServicoStatus.CANCELADO }],
				} as any)
				.mockResolvedValueOnce({} as any);
			const r = await service.finalizar("os1", "u1");
			expect(r.status).toBe(200);
		});

		it("entregar 200 quando FINALIZADA", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.FINALIZADA } as any);
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.entregar("os1", "u1");
			expect(r.status).toBe(200);
		});
	});

	describe("diagnóstico texto", () => {
		it("404 quando OS não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.atualizarDiagnostico("os1", { diagnostico: "tx" });
			expect(r.status).toBe(404);
		});

		it("422 quando status diferente de EM_DIAGNOSTICO", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.RECEBIDA } as any);
			const r = await service.atualizarDiagnostico("os1", { diagnostico: "tx" });
			expect(r.status).toBe(422);
		});

		it("200 atualiza diagnóstico", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			prisma.ordemServico.update.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.atualizarDiagnostico("os1", { diagnostico: "tx" });
			expect(r.status).toBe(200);
		});
	});

	describe("itens de serviço", () => {
		it("addItemServico 404 OS", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.addItemServico("x", { servicoId: "s1" });
			expect(r.status).toBe(404);
		});

		it("addItemServico 422 status fechado", async () => {
			repo.findById.mockResolvedValueOnce({ status: OsStatus.AGUARDANDO_APROVACAO } as any);
			const r = await service.addItemServico("os1", { servicoId: "s1" });
			expect(r.status).toBe(422);
		});

		it("addItemServico 404 serviço", async () => {
			repo.findById.mockResolvedValueOnce({ status: OsStatus.EM_DIAGNOSTICO } as any);
			servicos.findById.mockResolvedValueOnce(null);
			const r = await service.addItemServico("os1", { servicoId: "s1" });
			expect(r.status).toBe(404);
		});

		it("addItemServico 422 serviço inativo", async () => {
			repo.findById.mockResolvedValueOnce({ status: OsStatus.EM_DIAGNOSTICO } as any);
			servicos.findById.mockResolvedValueOnce({ id: "s1", ativo: false } as any);
			const r = await service.addItemServico("os1", { servicoId: "s1" });
			expect(r.status).toBe(422);
		});

		it("addItemServico 201", async () => {
			repo.findById.mockResolvedValueOnce({ status: OsStatus.EM_DIAGNOSTICO } as any);
			servicos.findById.mockResolvedValueOnce({ id: "s1", preco: D(50) } as any);
			prisma.osItemServico.create.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.addItemServico("os1", { servicoId: "s1", quantidade: 2 });
			expect(r.status).toBe(201);
		});

		it("removerItemServico 404 quando item de outra OS", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({ id: "i", ordemServicoId: "outra" });
			const r = await service.removerItemServico("os1", "i");
			expect(r.status).toBe(404);
		});

		it("removerItemServico 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({ id: "i", ordemServicoId: "os1" });
			prisma.osItemServico.delete.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.removerItemServico("os1", "i");
			expect(r.status).toBe(200);
		});

		it("iniciarItemServico 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO, iniciadoExecucaoEm: null } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({
				id: "i1",
				ordemServicoId: "os1",
				status: OsItemServicoStatus.PENDENTE,
			});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.iniciarItemServico("os1", "i1");
			expect(r.status).toBe(200);
		});

		it("concluirItemServico 422 se não estiver em execução", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({
				id: "i1",
				ordemServicoId: "os1",
				status: OsItemServicoStatus.PENDENTE,
			});
			const r = await service.concluirItemServico("os1", "i1");
			expect(r.status).toBe(422);
		});

		it("cancelarItemServico 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({
				id: "i1",
				ordemServicoId: "os1",
				status: OsItemServicoStatus.EM_EXECUCAO,
			});
			prisma.osItemServico.update.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			const r = await service.cancelarItemServico("os1", "i1");
			expect(r.status).toBe(200);
		});

		it("iniciarItemServico 404 quando OS não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.iniciarItemServico("x", "i1")).status).toBe(404);
		});

		it("iniciarItemServico 422 quando OS não está em execução", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.RECEBIDA } as any);
			expect((await service.iniciarItemServico("os1", "i1")).status).toBe(422);
		});

		it("iniciarItemServico 404 quando item de outra OS", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({ id: "i1", ordemServicoId: "outra" });
			expect((await service.iniciarItemServico("os1", "i1")).status).toBe(404);
		});

		it("iniciarItemServico 422 quando item não está PENDENTE", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({
				id: "i1",
				ordemServicoId: "os1",
				status: OsItemServicoStatus.EM_EXECUCAO,
			});
			expect((await service.iniciarItemServico("os1", "i1")).status).toBe(422);
		});

		it("concluirItemServico 404 OS", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.concluirItemServico("x", "i1")).status).toBe(404);
		});

		it("concluirItemServico 422 status OS errado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.RECEBIDA } as any);
			expect((await service.concluirItemServico("os1", "i1")).status).toBe(422);
		});

		it("concluirItemServico 404 item de outra OS", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({ id: "i1", ordemServicoId: "outra" });
			expect((await service.concluirItemServico("os1", "i1")).status).toBe(404);
		});

		it("concluirItemServico 200 sem iniciadoExecucaoEm prévio", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({
				id: "i1",
				ordemServicoId: "os1",
				status: OsItemServicoStatus.EM_EXECUCAO,
				iniciadoExecucaoEm: null,
			});
			prisma.osItemServico.update.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			expect((await service.concluirItemServico("os1", "i1")).status).toBe(200);
		});

		it("cancelarItemServico 404 OS", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.cancelarItemServico("x", "i1")).status).toBe(404);
		});

		it("cancelarItemServico 422 status OS errado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.RECEBIDA } as any);
			expect((await service.cancelarItemServico("os1", "i1")).status).toBe(422);
		});

		it("cancelarItemServico 404 item de outra OS", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({ id: "i1", ordemServicoId: "outra" });
			expect((await service.cancelarItemServico("os1", "i1")).status).toBe(404);
		});

		it("cancelarItemServico 422 já concluído", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.osItemServico.findUnique.mockResolvedValueOnce({
				id: "i1",
				ordemServicoId: "os1",
				status: OsItemServicoStatus.CONCLUIDO,
			});
			expect((await service.cancelarItemServico("os1", "i1")).status).toBe(422);
		});

		it("removerItemInsumo 404 OS", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.removerItemInsumo("x", "ii1")).status).toBe(404);
		});

		it("removerItemInsumo 422 status fechado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.AGUARDANDO_APROVACAO } as any);
			expect((await service.removerItemInsumo("os1", "ii1")).status).toBe(422);
		});

		it("removerItemInsumo 404 quando item de outra OS", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			prisma.osItemInsumo.findUnique.mockResolvedValueOnce({ id: "ii1", ordemServicoId: "outra" });
			expect((await service.removerItemInsumo("os1", "ii1")).status).toBe(404);
		});

		it("removerItemInsumo 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			prisma.osItemInsumo.findUnique.mockResolvedValueOnce({ id: "ii1", ordemServicoId: "os1" });
			prisma.osItemInsumo.delete.mockResolvedValueOnce({});
			repo.findByIdFull.mockResolvedValueOnce({} as any);
			expect((await service.removerItemInsumo("os1", "ii1")).status).toBe(200);
		});

		it("addItemInsumo 404 OS", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.addItemInsumo("x", { insumoId: "i1", quantidade: 1 })).status).toBe(404);
		});

		it("addItemInsumo 404 insumo", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			insumos.findById.mockResolvedValueOnce(null);
			expect((await service.addItemInsumo("os1", { insumoId: "i1", quantidade: 1 })).status).toBe(404);
		});

		it("addItemInsumo 422 insumo inativo", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_DIAGNOSTICO } as any);
			insumos.findById.mockResolvedValueOnce({ id: "i1", ativo: false } as any);
			expect((await service.addItemInsumo("os1", { insumoId: "i1", quantidade: 1 })).status).toBe(422);
		});
	});

	describe("baixa de estoque - branches extras", () => {
		it("aprovação dispara warn quando posterior ficaria abaixo do estoque mínimo", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.AGUARDANDO_APROVACAO,
					cliente: { id: "c1", documento: "52998224725", nome: "Fulano" },
					itensServico: [],
					itensInsumo: [{ id: "ii1", insumoId: "i1", quantidade: 5 }],
				} as any)
				.mockResolvedValueOnce({ id: "os1", status: OsStatus.EM_EXECUCAO } as any);
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce({
					id: "i1",
					nome: "Filtro",
					codigo: "P-001",
					quantidadeEstoque: 6,
					estoqueMinimo: 10,
				});
				return fn(tx);
			});
			const warn = jest.spyOn((service as any).logger, "warn").mockImplementation(() => undefined);
			const r = await service.aprovarOrcamento("os1", { documento: "52998224725" });
			expect(r.status).toBe(200);
			expect(warn).toHaveBeenCalled();
		});

		it("aprovação reporta insumo inexistente como faltante", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.AGUARDANDO_APROVACAO,
					cliente: { id: "c1", documento: "52998224725", nome: "Fulano" },
					itensServico: [],
					itensInsumo: [{ id: "ii1", insumoId: "iX", quantidade: 1 }],
				} as any)
				.mockResolvedValueOnce({ id: "os1", status: OsStatus.BLOQUEADA } as any);
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.insumo.findUnique.mockResolvedValueOnce(null);
				return fn(tx);
			});
			const r = await service.aprovarOrcamento("os1", { documento: "52998224725" });
			expect(r.status).toBe(200);
			expect(r.message).toContain("bloqueada");
		});
	});

	describe("cancelar e finalizar - cobertura adicional", () => {
		it("finalizar 404 quando OS não existe", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.finalizar("x", "u1")).status).toBe(404);
		});

		it("finalizar 422 sem itensServico", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.EM_EXECUCAO,
				itensServico: [],
			} as any);
			expect((await service.finalizar("os1", "u1")).status).toBe(422);
		});

		it("cancelar 404", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.cancelar("x", "u1", {})).status).toBe(404);
		});

		it("cancelar quando ainda não aprovada não estorna estoque", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.RECEBIDA,
					aprovadoEm: null,
					itensInsumo: [],
				} as any)
				.mockResolvedValueOnce({ id: "os1", status: OsStatus.CANCELADA } as any);
			const movs: any[] = [];
			prisma.$transaction.mockImplementationOnce(async (fn: any) => {
				const tx = baseTx();
				tx.movimentoEstoque.create.mockImplementation((arg: any) => {
					movs.push(arg.data);
					return arg.data;
				});
				return fn(tx);
			});
			expect((await service.cancelar("os1", "u1", { motivo: "x" })).status).toBe(200);
			expect(movs).toHaveLength(0);
		});

		it("aprovarOrcamento 404 quando OS não existe", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.aprovarOrcamento("x", { documento: "52998224725" })).status).toBe(404);
		});

		it("rejeitarOrcamento 404 quando OS não existe", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.rejeitarOrcamento("x", { documento: "52998224725" })).status).toBe(404);
		});

		it("rejeitarOrcamento 422 quando status inválido", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.EM_EXECUCAO,
				cliente: { documento: "52998224725" },
			} as any);
			expect((await service.rejeitarOrcamento("os1", { documento: "52998224725" })).status).toBe(422);
		});

		it("desbloquear 404 quando OS não existe", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.desbloquear("x", "u1", {})).status).toBe(404);
		});
	});

	describe("gerarOrcamento", () => {
		it("404 OS", async () => {
			repo.findByIdFull.mockResolvedValueOnce(null);
			expect((await service.gerarOrcamento("x", "u1")).status).toBe(404);
		});

		it("422 status inválido", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.RECEBIDA,
				itensServico: [],
				itensInsumo: [],
			} as any);
			expect((await service.gerarOrcamento("os1", "u1")).status).toBe(422);
		});

		it("422 sem serviços", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.EM_DIAGNOSTICO,
				itensServico: [],
				itensInsumo: [{ subtotal: D(1) }],
			} as any);
			expect((await service.gerarOrcamento("os1", "u1")).status).toBe(422);
		});

		it("200 calcula total e transita", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.EM_DIAGNOSTICO,
					itensServico: [{ subtotal: D(100) }],
					itensInsumo: [{ subtotal: D(50) }],
				} as any)
				.mockResolvedValueOnce({} as any);
			const r = await service.gerarOrcamento("os1", "u1");
			expect(r.status).toBe(200);
		});
	});

	describe("rejeitarOrcamento", () => {
		it("403 documento errado", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.AGUARDANDO_APROVACAO,
				cliente: { documento: "11122233344" },
			} as any);
			const r = await service.rejeitarOrcamento("os1", { documento: "00000000000" });
			expect(r.status).toBe(403);
		});

		it("200 cancela", async () => {
			repo.findByIdFull
				.mockResolvedValueOnce({
					id: "os1",
					status: OsStatus.AGUARDANDO_APROVACAO,
					cliente: { documento: "52998224725" },
				} as any)
				.mockResolvedValueOnce({} as any);
			const r = await service.rejeitarOrcamento("os1", { documento: "529.982.247-25" });
			expect(r.status).toBe(200);
		});
	});

	describe("consultaPublica", () => {
		it("404 quando número não existe", async () => {
			repo.findByNumero.mockResolvedValueOnce(null);
			const r = await service.consultaPublica("OS-2026-000001", "52998224725");
			expect(r.status).toBe(404);
		});

		it("403 quando documento não confere", async () => {
			repo.findByNumero.mockResolvedValueOnce({
				cliente: { documento: "52998224725", nome: "Fulano" },
				veiculo: { placa: "ABC1234", marca: "X", modelo: "Y" },
				itensServico: [],
				itensInsumo: [],
				historico: [],
			} as any);
			const r = await service.consultaPublica("OS-2026-000001", "00000000000");
			expect(r.status).toBe(403);
		});

		it("200 quando documento confere e mascara nome do cliente", async () => {
			repo.findByNumero.mockResolvedValueOnce({
				numero: "OS-2026-000001",
				cliente: { documento: "52998224725", nome: "Fulano da Silva Santos" },
				veiculo: { placa: "ABC1234", marca: "X", modelo: "Y" },
				status: OsStatus.EM_EXECUCAO,
				diagnostico: null,
				valorTotal: D(0),
				itensServico: [],
				itensInsumo: [],
				historico: [],
			} as any);
			const r = await service.consultaPublica("OS-2026-000001", "529.982.247-25");
			expect(r.status).toBe(200);
			const data = r.data as any;
			expect(data.cliente).not.toContain("Silva");
			expect(data.cliente.startsWith("Fulano")).toBe(true);
			expect(data.cliente.endsWith("Santos")).toBe(true);
		});

		it("200 quando documento é CNPJ alfanumérico com máscara", async () => {
			repo.findByNumero.mockResolvedValueOnce({
				numero: "OS-2026-000002",
				cliente: { documento: "12ABC34501DE35", nome: "Oficina Exemplo LTDA" },
				veiculo: { placa: "ABC1234", marca: "X", modelo: "Y" },
				status: OsStatus.EM_EXECUCAO,
				diagnostico: null,
				valorTotal: D(0),
				itensServico: [],
				itensInsumo: [],
				historico: [],
			} as any);
			const r = await service.consultaPublica("OS-2026-000002", "12.ABC.345/01DE-35");
			expect(r.status).toBe(200);
		});

		it("200 mascara sobrenome quando nome possui duas partes", async () => {
			repo.findByNumero.mockResolvedValueOnce({
				numero: "OS-2026-000003",
				cliente: { documento: "52998224725", nome: "Cliente Teste" },
				veiculo: { placa: "ABC1234", marca: "X", modelo: "Y" },
				status: OsStatus.EM_EXECUCAO,
				diagnostico: null,
				valorTotal: D(0),
				itensServico: [],
				itensInsumo: [],
				historico: [],
			} as any);
			const r = await service.consultaPublica("OS-2026-000003", "529.982.247-25");
			expect(r.status).toBe(200);
			const data = r.data as any;
			expect(data.cliente).not.toBe("Cliente Teste");
			expect(data.cliente.startsWith("Cliente")).toBe(true);
		});
	});

	describe("removerItemServico - branches extras", () => {
		it("422 quando OS não está em status que permite remoção", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1", status: OsStatus.AGUARDANDO_APROVACAO } as any);
			const r = await service.removerItemServico("os1", "i");
			expect(r.status).toBe(422);
		});
	});

	describe("finalizar - branches extras", () => {
		it("422 quando transição inválida (status RECEBIDA)", async () => {
			repo.findByIdFull.mockResolvedValueOnce({
				id: "os1",
				status: OsStatus.RECEBIDA,
				itensServico: [{ status: OsItemServicoStatus.CONCLUIDO }],
			} as any);
			const r = await service.finalizar("os1", "u1");
			expect(r.status).toBe(422);
			expect(r.message).toContain("Transição inválida");
		});
	});

	describe("consultaPublica - itens e mascara nome único", () => {
		it("200 com itensServico e itensInsumo preenchidos — cobre callbacks do map", async () => {
			repo.findByNumero.mockResolvedValueOnce({
				numero: "OS-2026-000004",
				cliente: { documento: "52998224725", nome: "Cliente Teste" },
				veiculo: { placa: "ABC1234", marca: "Fiat", modelo: "Uno" },
				status: OsStatus.EM_EXECUCAO,
				diagnostico: "ok",
				valorTotal: D(150),
				itensServico: [
					{
						servico: { nome: "Troca de óleo" },
						status: OsItemServicoStatus.CONCLUIDO,
						iniciadoExecucaoEm: new Date(),
						finalizadoExecucaoEm: new Date(),
						quantidade: 1,
						precoUnitario: D(100),
						subtotal: D(100),
					},
				],
				itensInsumo: [
					{
						insumo: { nome: "Filtro de óleo" },
						quantidade: 1,
						precoUnitario: D(50),
						subtotal: D(50),
					},
				],
				historico: [{ statusAnterior: null, statusNovo: OsStatus.RECEBIDA, observacao: null, createdAt: new Date() }],
			} as any);
			const r = await service.consultaPublica("OS-2026-000004", "529.982.247-25");
			expect(r.status).toBe(200);
			const data = r.data as any;
			expect(data.itensServico).toHaveLength(1);
			expect(data.itensServico[0].nome).toBe("Troca de óleo");
			expect(data.itensInsumo).toHaveLength(1);
			expect(data.itensInsumo[0].nome).toBe("Filtro de óleo");
		});

		it("200 mascara nome com uma única palavra", async () => {
			repo.findByNumero.mockResolvedValueOnce({
				numero: "OS-2026-000005",
				cliente: { documento: "52998224725", nome: "Fulano" },
				veiculo: { placa: "ABC1234", marca: "X", modelo: "Y" },
				status: OsStatus.EM_EXECUCAO,
				diagnostico: null,
				valorTotal: D(0),
				itensServico: [],
				itensInsumo: [],
				historico: [],
			} as any);
			const r = await service.consultaPublica("OS-2026-000005", "529.982.247-25");
			expect(r.status).toBe(200);
			const data = r.data as any;
			expect(data.cliente).toMatch(/^F\*+$/);
		});
	});

	describe("obterHistorico", () => {
		it("404 quando OS não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			const r = await service.obterHistorico("os1");
			expect(r.status).toBe(404);
			expect(r.message).toContain("OS não encontrada");
		});

		it("200 retorna histórico ordenado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "os1" } as any);
			const historicoMock = [
				{ id: "h1", statusAnterior: null, statusNovo: OsStatus.RECEBIDA, createdAt: new Date() },
				{ id: "h2", statusAnterior: OsStatus.RECEBIDA, statusNovo: OsStatus.EM_DIAGNOSTICO, createdAt: new Date() },
			];
			repo.findHistorico.mockResolvedValueOnce(historicoMock as any);
			const r = await service.obterHistorico("os1");
			expect(r.status).toBe(200);
			expect(r.data).toEqual(historicoMock);
			expect(repo.findHistorico).toHaveBeenCalledWith("os1");
		});
	});
});
