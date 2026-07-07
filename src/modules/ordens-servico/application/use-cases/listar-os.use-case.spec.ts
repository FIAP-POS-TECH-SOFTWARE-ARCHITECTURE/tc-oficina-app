import { OsStatus } from "../../domain/os-status";
import { STATUS_OCULTOS_LISTAGEM } from "../../domain/ordenacao-listagem";
import { ListarOsUseCase } from "./listar-os.use-case";

const gateway = { listarParaOrdenacao: jest.fn() };

describe("ListarOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("usa paginação default (page 1, pageSize 20) e exclui status ocultos", async () => {
		gateway.listarParaOrdenacao.mockResolvedValue([]);
		const res = await new ListarOsUseCase(gateway as any).execute({});
		expect(res.status).toBe(200);
		expect(gateway.listarParaOrdenacao).toHaveBeenCalledWith({
			status: undefined,
			excluirStatus: STATUS_OCULTOS_LISTAGEM,
			clienteId: undefined,
		});
		expect(res.data).toEqual({ total: 0, page: 1, pageSize: 20, items: [] });
	});

	it("ordena por prioridade de status e antiguidade", async () => {
		gateway.listarParaOrdenacao.mockResolvedValue([
			{ id: "1", status: OsStatus.RECEBIDA, createdAt: new Date("2026-01-01") },
			{ id: "2", status: OsStatus.EM_EXECUCAO, createdAt: new Date("2026-03-01") },
			{ id: "3", status: OsStatus.EM_EXECUCAO, createdAt: new Date("2026-02-01") },
		]);
		const res = await new ListarOsUseCase(gateway as any).execute({});
		const ids = (res.data as { items: { id: string }[] }).items.map((i) => i.id);
		expect(ids).toEqual(["3", "2", "1"]);
	});

	it("filtro explícito por status=FINALIZADA continua funcionando (sem exclusão)", async () => {
		gateway.listarParaOrdenacao.mockResolvedValue([{ id: "9", status: OsStatus.FINALIZADA, createdAt: new Date() }]);
		const res = await new ListarOsUseCase(gateway as any).execute({ status: OsStatus.FINALIZADA });
		expect(gateway.listarParaOrdenacao).toHaveBeenCalledWith({
			status: OsStatus.FINALIZADA,
			excluirStatus: undefined,
			clienteId: undefined,
		});
		expect((res.data as { items: unknown[] }).items).toHaveLength(1);
	});

	it("aplica filtro de cliente", async () => {
		gateway.listarParaOrdenacao.mockResolvedValue([]);
		await new ListarOsUseCase(gateway as any).execute({ clienteId: "c1" });
		expect(gateway.listarParaOrdenacao).toHaveBeenCalledWith({
			status: undefined,
			excluirStatus: STATUS_OCULTOS_LISTAGEM,
			clienteId: "c1",
		});
	});

	it("pagina após ordenar", async () => {
		gateway.listarParaOrdenacao.mockResolvedValue(
			Array.from({ length: 25 }, (_, i) => ({ id: `${i}`, status: OsStatus.RECEBIDA, createdAt: new Date(2026, 0, i + 1) })),
		);
		const res = await new ListarOsUseCase(gateway as any).execute({ page: 2, pageSize: 20 });
		const body = res.data as { total: number; items: unknown[] };
		expect(body.total).toBe(25);
		expect(body.items).toHaveLength(5);
	});
});
