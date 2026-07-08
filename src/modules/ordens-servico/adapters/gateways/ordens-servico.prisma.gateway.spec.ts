import { OsStatus as PrismaOsStatus, TipoMovimentoEstoque } from "@prisma/client";
import { OsStatus } from "../../domain/os-status";
import { OsDetalhe } from "../../application/ports/os-types";
import { OrdensServicoPrismaGateway } from "./ordens-servico.prisma.gateway";

function baseTx() {
	return {
		ordemServico: { create: jest.fn(), update: jest.fn() },
		osHistoricoStatus: { create: jest.fn() },
		osItemServico: { update: jest.fn() },
		insumo: { findUnique: jest.fn(), update: jest.fn() },
		movimentoEstoque: { create: jest.fn() },
	};
}

describe("OrdensServicoPrismaGateway", () => {
	let prisma: any;
	let gateway: OrdensServicoPrismaGateway;

	beforeEach(() => {
		prisma = {
			ordemServico: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				count: jest.fn(),
				update: jest.fn(),
			},
			osHistoricoStatus: { findMany: jest.fn(), create: jest.fn() },
			osItemServico: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn() },
			osItemInsumo: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
			$transaction: jest.fn(),
			$queryRaw: jest.fn(),
		};
		gateway = new OrdensServicoPrismaGateway(prisma);
	});

	const osDetalhe = (overrides: Partial<OsDetalhe> = {}): OsDetalhe =>
		({
			id: "os1",
			numero: "OS-2026-000001",
			status: OsStatus.AGUARDANDO_APROVACAO,
			cliente: { nome: "Fulano", documento: "52998224725", email: null },
			veiculo: { placa: "ABC1234", marca: "X", modelo: "Y" },
			itensServico: [],
			itensInsumo: [{ id: "ii1", insumoId: "i1", quantidade: 2 }],
			historico: [],
			...overrides,
		}) as unknown as OsDetalhe;

	it("criarComHistorico cria OS e histórico na mesma transação", async () => {
		const tx = baseTx();
		tx.ordemServico.create.mockResolvedValueOnce({ id: "os1" });
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		const result = await gateway.criarComHistorico({ numero: "OS-2026-000001", clienteId: "c1", veiculoId: "v1" });

		expect(result).toEqual({ id: "os1" });
		expect(tx.ordemServico.create).toHaveBeenCalledWith({
			data: { numero: "OS-2026-000001", clienteId: "c1", veiculoId: "v1" },
		});
		expect(tx.osHistoricoStatus.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				ordemServicoId: "os1",
				statusAnterior: null,
				statusNovo: PrismaOsStatus.RECEBIDA,
			}),
		});
	});

	it("buscarDetalhePorId busca com include completo", async () => {
		prisma.ordemServico.findUnique.mockResolvedValueOnce({ id: "os1" });
		await gateway.buscarDetalhePorId("os1");
		expect(prisma.ordemServico.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "os1" }, include: expect.any(Object) }),
		);
	});

	it("listarParaOrdenacao filtra por status e clienteId com projeção mínima", async () => {
		prisma.ordemServico.findMany.mockResolvedValueOnce([]);
		await gateway.listarParaOrdenacao({ status: OsStatus.EM_EXECUCAO, clienteId: "c1" });
		expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { status: PrismaOsStatus.EM_EXECUCAO, clienteId: "c1" },
				select: { id: true, status: true, createdAt: true },
			}),
		);
	});

	it("buscarDetalhesPorIds busca com include completo só os ids pedidos", async () => {
		prisma.ordemServico.findMany.mockResolvedValueOnce([]);
		await gateway.buscarDetalhesPorIds(["os1", "os2"]);
		expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: { in: ["os1", "os2"] } }, include: expect.any(Object) }),
		);
	});

	it("buscarDetalhesPorIds com lista vazia não consulta o banco", async () => {
		await expect(gateway.buscarDetalhesPorIds([])).resolves.toEqual([]);
		expect(prisma.ordemServico.findMany).not.toHaveBeenCalled();
	});

	it("listarParaOrdenacao aplica notIn quando recebe excluirStatus", async () => {
		prisma.ordemServico.findMany.mockResolvedValueOnce([]);
		await gateway.listarParaOrdenacao({ excluirStatus: [OsStatus.FINALIZADA, OsStatus.ENTREGUE] });
		expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { status: { notIn: [PrismaOsStatus.FINALIZADA, PrismaOsStatus.ENTREGUE] } } }),
		);
	});

	it("transicionarComHistorico atualiza status com dadosExtras e grava histórico", async () => {
		const tx = baseTx();
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));
		const entregueEm = new Date("2026-07-05T12:00:00Z");

		await gateway.transicionarComHistorico({
			id: "os1",
			statusAnterior: OsStatus.FINALIZADA,
			statusNovo: OsStatus.ENTREGUE,
			usuarioId: "u1",
			dadosExtras: { entregueEm },
		});

		expect(tx.ordemServico.update).toHaveBeenCalledWith({
			where: { id: "os1" },
			data: { entregueEm, status: PrismaOsStatus.ENTREGUE },
		});
		expect(tx.osHistoricoStatus.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				ordemServicoId: "os1",
				statusAnterior: PrismaOsStatus.FINALIZADA,
				statusNovo: PrismaOsStatus.ENTREGUE,
				usuarioId: "u1",
			}),
		});
	});

	it("executarAprovacao com estoque suficiente baixa estoque e vai a EM_EXECUCAO", async () => {
		const tx = baseTx();
		tx.insumo.findUnique.mockResolvedValueOnce({
			id: "i1",
			nome: "Filtro",
			codigo: "P-001",
			quantidadeEstoque: 10,
			estoqueMinimo: 1,
		});
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		const agora = new Date();
		const resultado = await gateway.executarAprovacao(osDetalhe(), null, agora);

		expect(resultado).toEqual({ bloqueadaPorFaltaEstoque: false, faltantes: [] });
		expect(tx.insumo.update).toHaveBeenCalledWith({
			where: { id: "i1" },
			data: { quantidadeEstoque: 8 },
		});
		expect(tx.movimentoEstoque.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				tipo: TipoMovimentoEstoque.SAIDA,
				quantidade: 2,
				quantidadeAnterior: 10,
				quantidadePosterior: 8,
			}),
		});
		expect(tx.ordemServico.update).toHaveBeenCalledWith({
			where: { id: "os1" },
			data: expect.objectContaining({ status: PrismaOsStatus.EM_EXECUCAO, aprovadoEm: agora, iniciadoExecucaoEm: agora }),
		});
	});

	it("executarAprovacao sem estoque bloqueia sem baixar", async () => {
		const tx = baseTx();
		tx.insumo.findUnique.mockResolvedValueOnce({
			id: "i1",
			nome: "Filtro",
			codigo: "P-001",
			quantidadeEstoque: 1,
			estoqueMinimo: 1,
		});
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		const resultado = await gateway.executarAprovacao(osDetalhe(), null, new Date());

		expect(resultado.bloqueadaPorFaltaEstoque).toBe(true);
		expect(resultado.faltantes).toHaveLength(1);
		expect(tx.insumo.update).not.toHaveBeenCalled();
		expect(tx.movimentoEstoque.create).not.toHaveBeenCalled();
		expect(tx.ordemServico.update).toHaveBeenCalledWith({
			where: { id: "os1" },
			data: expect.objectContaining({ status: PrismaOsStatus.BLOQUEADA }),
		});
	});

	it("executarDesbloqueio sem estoque devolve faltantes sem transicionar", async () => {
		const tx = baseTx();
		tx.insumo.findUnique.mockResolvedValueOnce(null);
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		const resultado = await gateway.executarDesbloqueio(osDetalhe({ status: OsStatus.BLOQUEADA }), "u1", null, new Date());

		expect(resultado.faltantes).toHaveLength(1);
		expect(tx.ordemServico.update).not.toHaveBeenCalled();
	});

	it("executarCancelamento com estorno devolve estoque e registra movimento", async () => {
		const tx = baseTx();
		tx.insumo.findUnique.mockResolvedValueOnce({ id: "i1", quantidadeEstoque: 5 });
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		await gateway.executarCancelamento(osDetalhe({ status: OsStatus.EM_EXECUCAO }), "u1", "motivo x", true);

		expect(tx.insumo.update).toHaveBeenCalledWith({ where: { id: "i1" }, data: { quantidadeEstoque: 7 } });
		expect(tx.movimentoEstoque.create).toHaveBeenCalledWith({
			data: expect.objectContaining({ tipo: TipoMovimentoEstoque.ESTORNO, quantidade: 2 }),
		});
		expect(tx.ordemServico.update).toHaveBeenCalledWith({
			where: { id: "os1" },
			data: expect.objectContaining({ status: PrismaOsStatus.CANCELADA }),
		});
	});

	it("executarCancelamento sem estorno não toca no estoque", async () => {
		const tx = baseTx();
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));

		await gateway.executarCancelamento(osDetalhe({ status: OsStatus.BLOQUEADA }), "u1", null, false);

		expect(tx.insumo.findUnique).not.toHaveBeenCalled();
		expect(tx.movimentoEstoque.create).not.toHaveBeenCalled();
	});

	it("criarItemServico calcula subtotal e cria PENDENTE", async () => {
		await gateway.criarItemServico({ ordemServicoId: "os1", servicoId: "s1", precoUnitario: 10, quantidade: 3 });
		const arg = prisma.osItemServico.create.mock.calls[0][0];
		expect(arg.data.status).toBe("PENDENTE");
		expect(String(arg.data.subtotal)).toBe("30");
	});

	it("criarItemInsumo calcula subtotal", async () => {
		await gateway.criarItemInsumo({ ordemServicoId: "os1", insumoId: "i1", precoUnitario: 2.5, quantidade: 4 });
		const arg = prisma.osItemInsumo.create.mock.calls[0][0];
		expect(String(arg.data.subtotal)).toBe("10");
	});

	it("iniciarItemServico marca início da OS quando solicitado", async () => {
		const tx = baseTx();
		prisma.$transaction.mockImplementationOnce(async (fn: any) => fn(tx));
		const agora = new Date();

		await gateway.iniciarItemServico({ osId: "os1", itemId: "it1", agora, marcarInicioOs: true });

		expect(tx.osItemServico.update).toHaveBeenCalledWith({
			where: { id: "it1" },
			data: { status: "EM_EXECUCAO", iniciadoExecucaoEm: agora },
		});
		expect(tx.ordemServico.update).toHaveBeenCalledWith({
			where: { id: "os1" },
			data: { iniciadoExecucaoEm: agora },
		});
	});

	it("calcularTotal soma subtotais de serviços e insumos", () => {
		const os = osDetalhe({
			itensServico: [{ subtotal: 100 }, { subtotal: 50 }] as any,
			itensInsumo: [{ subtotal: 25 }] as any,
		});
		expect(String(gateway.calcularTotal(os))).toBe("175");
	});
});
