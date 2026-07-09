import { CriarVeiculoUseCase } from "./criar-veiculo.use-case";

const gateway = { buscarPorPlaca: jest.fn(), criar: jest.fn() };
const clientes = { buscarPorId: jest.fn() };

const dto = { placa: "ABC1234", marca: "X", modelo: "Y", ano: 2020 };

describe("CriarVeiculoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new CriarVeiculoUseCase(gateway as any, clientes as any);

	it("404 quando cliente não existe", async () => {
		clientes.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("c1", dto)).status).toBe(404);
	});

	it("422 quando cliente está inativado", async () => {
		clientes.buscarPorId.mockResolvedValueOnce({ id: "c1", ativo: false });
		expect((await useCase().execute("c1", dto)).status).toBe(422);
	});

	it("409 quando placa já cadastrada", async () => {
		clientes.buscarPorId.mockResolvedValueOnce({ id: "c1", ativo: true });
		gateway.buscarPorPlaca.mockResolvedValueOnce({ id: "v1" });
		expect((await useCase().execute("c1", { ...dto, placa: "abc1234" })).status).toBe(409);
	});

	it("201 normaliza placa e cria", async () => {
		clientes.buscarPorId.mockResolvedValueOnce({ id: "c1", ativo: true });
		gateway.buscarPorPlaca.mockResolvedValueOnce(null);
		gateway.criar.mockResolvedValueOnce({ id: "v1" });
		const r = await useCase().execute("c1", { ...dto, placa: "abc-1234" });
		expect(r.status).toBe(201);
		expect(gateway.criar).toHaveBeenCalledWith(expect.objectContaining({ placa: "ABC1234", clienteId: "c1" }));
	});
});
