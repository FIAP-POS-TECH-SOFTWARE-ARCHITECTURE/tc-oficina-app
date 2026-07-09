import { AtualizarServicoUseCase } from "./atualizar-servico.use-case";

const gateway = { buscarPorId: jest.fn(), buscarPorNome: jest.fn(), atualizar: jest.fn() };

describe("AtualizarServicoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new AtualizarServicoUseCase(gateway as any);

	it("404 quando serviço não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("x", { nome: "novo" })).status).toBe(404);
	});

	it("422 quando serviço inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", nome: "antigo", ativo: false });
		expect((await useCase().execute("s1", { preco: 99 })).status).toBe(422);
	});

	it("409 quando rename para nome existente", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", nome: "antigo", ativo: true });
		gateway.buscarPorNome.mockResolvedValueOnce({ id: "s2" });
		expect((await useCase().execute("s1", { nome: "novo" })).status).toBe(409);
	});

	it("200 atualiza sem trocar nome", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", nome: "antigo", ativo: true });
		gateway.atualizar.mockResolvedValueOnce({ id: "s1" });
		expect((await useCase().execute("s1", { preco: 99 })).status).toBe(200);
		expect(gateway.buscarPorNome).not.toHaveBeenCalled();
	});

	it("200 quando rename para mesmo nome (sem conflict)", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", nome: "antigo", ativo: true });
		gateway.atualizar.mockResolvedValueOnce({ id: "s1" });
		expect((await useCase().execute("s1", { nome: "antigo" })).status).toBe(200);
	});

	it("200 quando rename para nome novo sem conflito", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", nome: "antigo", ativo: true });
		gateway.buscarPorNome.mockResolvedValueOnce(null);
		gateway.atualizar.mockResolvedValueOnce({ id: "s1" });
		expect((await useCase().execute("s1", { nome: "novo" })).status).toBe(200);
	});
});
