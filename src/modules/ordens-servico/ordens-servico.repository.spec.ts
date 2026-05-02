import { OsStatus } from "@prisma/client";
import { OrdensServicoRepository } from "./ordens-servico.repository";

describe("OrdensServicoRepository", () => {
	let prisma: any;
	let repo: OrdensServicoRepository;

	beforeEach(() => {
		prisma = {
			ordemServico: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				count: jest.fn(),
			},
			osHistoricoStatus: {
				findMany: jest.fn(),
			},
			$transaction: jest.fn(),
			$queryRaw: jest.fn(),
		};
		repo = new OrdensServicoRepository(prisma);
	});

	it("create delega para prisma.ordemServico.create", async () => {
		prisma.ordemServico.create.mockResolvedValueOnce({ id: "os1" });
		await repo.create({ numero: "OS-2026-000001", clienteId: "c1", veiculoId: "v1" });
		expect(prisma.ordemServico.create).toHaveBeenCalledWith({
			data: { numero: "OS-2026-000001", clienteId: "c1", veiculoId: "v1" },
		});
	});

	it("findByIdFull busca com include completo", async () => {
		prisma.ordemServico.findUnique.mockResolvedValueOnce({ id: "os1" });
		await repo.findByIdFull("os1");
		expect(prisma.ordemServico.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "os1" }, include: expect.any(Object) }),
		);
	});

	it("findByNumero usa where.numero", async () => {
		prisma.ordemServico.findUnique.mockResolvedValueOnce(null);
		await repo.findByNumero("OS-2026-000001");
		expect(prisma.ordemServico.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { numero: "OS-2026-000001" } }));
	});

	it("findById usa apenas where", async () => {
		prisma.ordemServico.findUnique.mockResolvedValueOnce(null);
		await repo.findById("os1");
		expect(prisma.ordemServico.findUnique).toHaveBeenCalledWith({ where: { id: "os1" } });
	});

	it("list constrói where vazio quando sem filtros e usa $transaction", async () => {
		prisma.$transaction.mockResolvedValueOnce([0, []]);
		await repo.list({ skip: 0, take: 10 });
		expect(prisma.ordemServico.count).toHaveBeenCalledWith({ where: {} });
		expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {}, skip: 0, take: 10 }));
		expect(prisma.$transaction).toHaveBeenCalled();
	});

	it("list filtra por status e clienteId", async () => {
		prisma.$transaction.mockResolvedValueOnce([0, []]);
		await repo.list({ skip: 0, take: 10, status: OsStatus.EM_EXECUCAO, clienteId: "c1" });
		expect(prisma.ordemServico.count).toHaveBeenCalledWith({
			where: { status: OsStatus.EM_EXECUCAO, clienteId: "c1" },
		});
	});

	it("contadorAno calcula range completo do ano em UTC", async () => {
		prisma.ordemServico.count.mockResolvedValueOnce(7);
		const total = await repo.contadorAno(2026);
		expect(total).toBe(7);
		const arg = prisma.ordemServico.count.mock.calls[0][0];
		expect(arg.where.createdAt.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
		expect(arg.where.createdAt.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
	});

	it("tempoMedioPorMes delega ao $queryRaw e devolve resultado", async () => {
		prisma.$queryRaw.mockResolvedValueOnce([{ ano_mes: "2026-04", tempo_medio_min: 60, total: 1 }]);
		const result = await repo.tempoMedioPorMes();
		expect(prisma.$queryRaw).toHaveBeenCalled();
		expect(result).toEqual([{ ano_mes: "2026-04", tempo_medio_min: 60, total: 1 }]);
	});

	it("findHistorico busca histórico ordenado por data", async () => {
		const historicoMock = [
			{ id: "h1", ordemServicoId: "os1", statusAnterior: null, statusNovo: OsStatus.RECEBIDA, createdAt: new Date() },
			{ id: "h2", ordemServicoId: "os1", statusAnterior: OsStatus.RECEBIDA, statusNovo: OsStatus.EM_DIAGNOSTICO, createdAt: new Date() },
		];
		prisma.osHistoricoStatus.findMany.mockResolvedValueOnce(historicoMock);
		const result = await repo.findHistorico("os1");
		expect(prisma.osHistoricoStatus.findMany).toHaveBeenCalledWith({
			where: { ordemServicoId: "os1" },
			include: { usuario: true },
			orderBy: { createdAt: "asc" },
		});
		expect(result).toEqual(historicoMock);
	});
});
