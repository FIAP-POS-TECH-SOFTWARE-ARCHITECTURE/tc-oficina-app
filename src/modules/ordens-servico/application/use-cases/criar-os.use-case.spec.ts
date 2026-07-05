import { CriarOsUseCase } from "./criar-os.use-case";

const gateway = {
	criarComHistorico: jest.fn().mockResolvedValue({ id: "os-1" }),
	contarPorAno: jest.fn().mockResolvedValue(0),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os-1", numero: "OS-2026-000001" }),
};
const clientes = { buscarPorId: jest.fn() };
const veiculos = { buscarPorId: jest.fn() };

function makeSut() {
	return new CriarOsUseCase(gateway as any, clientes, veiculos);
}

describe("CriarOsUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.criarComHistorico.mockResolvedValue({ id: "os-1" });
		gateway.contarPorAno.mockResolvedValue(0);
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os-1", numero: "OS-2026-000001" });
	});

	it("cria OS e retorna 201 com detalhe", async () => {
		clientes.buscarPorId.mockResolvedValue({ id: "c1", ativo: true });
		veiculos.buscarPorId.mockResolvedValue({ id: "v1", ativo: true, clienteId: "c1" });
		const res = await makeSut().execute({ clienteId: "c1", veiculoId: "v1" });
		expect(res.status).toBe(201);
		expect(gateway.criarComHistorico).toHaveBeenCalledWith(
			expect.objectContaining({ clienteId: "c1", veiculoId: "v1", numero: expect.stringMatching(/^OS-\d{4}-\d{6}$/) }),
		);
	});

	it("404 quando cliente não existe", async () => {
		clientes.buscarPorId.mockResolvedValue(null);
		const res = await makeSut().execute({ clienteId: "cX", veiculoId: "v1" });
		expect(res.status).toBe(404);
		expect(gateway.criarComHistorico).not.toHaveBeenCalled();
	});

	it("422 quando cliente inativo", async () => {
		clientes.buscarPorId.mockResolvedValue({ id: "c1", ativo: false });
		const res = await makeSut().execute({ clienteId: "c1", veiculoId: "v1" });
		expect(res.status).toBe(422);
	});

	it("404 quando veículo não existe", async () => {
		clientes.buscarPorId.mockResolvedValue({ id: "c1", ativo: true });
		veiculos.buscarPorId.mockResolvedValue(null);
		const res = await makeSut().execute({ clienteId: "c1", veiculoId: "vX" });
		expect(res.status).toBe(404);
	});

	it("422 quando veículo inativo", async () => {
		clientes.buscarPorId.mockResolvedValue({ id: "c1", ativo: true });
		veiculos.buscarPorId.mockResolvedValue({ id: "v1", ativo: false, clienteId: "c1" });
		const res = await makeSut().execute({ clienteId: "c1", veiculoId: "v1" });
		expect(res.status).toBe(422);
	});

	it("400 quando veículo não pertence ao cliente", async () => {
		clientes.buscarPorId.mockResolvedValue({ id: "c1", ativo: true });
		veiculos.buscarPorId.mockResolvedValue({ id: "v1", ativo: true, clienteId: "OUTRO" });
		const res = await makeSut().execute({ clienteId: "c1", veiculoId: "v1" });
		expect(res.status).toBe(400);
	});
});
