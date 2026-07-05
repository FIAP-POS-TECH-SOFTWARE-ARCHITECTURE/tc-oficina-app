import { OsStatus } from "../../domain/os-status";
import { ListarOsUseCase } from "./listar-os.use-case";

const gateway = { listar: jest.fn() };

describe("ListarOsUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("usa paginação default (page 1, pageSize 20)", async () => {
		gateway.listar.mockResolvedValue([0, []]);
		const res = await new ListarOsUseCase(gateway as any).execute({});
		expect(res.status).toBe(200);
		expect(gateway.listar).toHaveBeenCalledWith({ status: undefined, clienteId: undefined, skip: 0, take: 20 });
		expect(res.data).toEqual({ total: 0, page: 1, pageSize: 20, items: [] });
	});

	it("aplica filtros e paginação custom", async () => {
		gateway.listar.mockResolvedValue([5, [{ id: "os1" }]]);
		const res = await new ListarOsUseCase(gateway as any).execute({
			status: OsStatus.EM_EXECUCAO,
			clienteId: "c1",
			page: 2,
			pageSize: 10,
		});
		expect(gateway.listar).toHaveBeenCalledWith({ status: OsStatus.EM_EXECUCAO, clienteId: "c1", skip: 10, take: 10 });
		expect(res.data).toEqual({ total: 5, page: 2, pageSize: 10, items: [{ id: "os1" }] });
	});
});
