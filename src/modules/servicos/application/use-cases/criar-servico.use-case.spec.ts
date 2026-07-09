import { CriarServicoUseCase } from "./criar-servico.use-case";

const gateway = { buscarPorNome: jest.fn(), criar: jest.fn() };

describe("CriarServicoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("409 quando nome duplicado", async () => {
		gateway.buscarPorNome.mockResolvedValueOnce({ id: "x" });
		const r = await new CriarServicoUseCase(gateway as any).execute({
			nome: "Troca de óleo",
			preco: 50,
			tempoEstimadoMin: 30,
		});
		expect(r.status).toBe(409);
	});

	it("201 quando criado", async () => {
		gateway.buscarPorNome.mockResolvedValueOnce(null);
		gateway.criar.mockResolvedValueOnce({ id: "s1" });
		const r = await new CriarServicoUseCase(gateway as any).execute({
			nome: "Troca de óleo",
			preco: 50,
			tempoEstimadoMin: 30,
		});
		expect(r.status).toBe(201);
		expect(gateway.criar).toHaveBeenCalledWith(
			expect.objectContaining({ nome: "Troca de óleo", preco: 50, tempoEstimadoMin: 30 }),
		);
	});
});
