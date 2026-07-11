import { ListarVeiculosDoClienteUseCase } from "./listar-veiculos-do-cliente.use-case";

const gateway = { listarPorCliente: jest.fn() };
const clientes = { buscarPorId: jest.fn() };

describe("ListarVeiculosDoClienteUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new ListarVeiculosDoClienteUseCase(gateway as any, clientes as any);

	it("404 quando cliente não existe", async () => {
		clientes.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("c1")).status).toBe(404);
	});

	it("200 lista veículos do cliente", async () => {
		clientes.buscarPorId.mockResolvedValueOnce({ id: "c1" });
		gateway.listarPorCliente.mockResolvedValueOnce([{ id: "v1" }]);
		const r = await useCase().execute("c1");
		expect(r.status).toBe(200);
		expect(gateway.listarPorCliente).toHaveBeenCalledWith("c1");
	});
});
