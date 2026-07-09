import { InativarServicoUseCase } from "./inativar-servico.use-case";

const gateway = { buscarPorId: jest.fn(), inativar: jest.fn() };

describe("InativarServicoUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando serviço não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new InativarServicoUseCase(gateway as any).execute("x")).status).toBe(404);
	});

	it("422 quando serviço já inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", ativo: false });
		expect((await new InativarServicoUseCase(gateway as any).execute("s1")).status).toBe(422);
	});

	it("200 inativa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "s1", ativo: true });
		gateway.inativar.mockResolvedValueOnce({ id: "s1", ativo: false });
		expect((await new InativarServicoUseCase(gateway as any).execute("s1")).status).toBe(200);
	});
});
