import { OsStatus } from "../../domain/os-status";
import { AddItemServicoUseCase } from "./add-item-servico.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	criarItemServico: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};
const servicos = { buscarPorId: jest.fn() };

function makeSut() {
	return new AddItemServicoUseCase(gateway as any, servicos);
}

describe("AddItemServicoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", { servicoId: "s1" })).status).toBe(404);
	});

	it("422 quando status não permite adicionar item", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.AGUARDANDO_APROVACAO });
		expect((await makeSut().execute("os1", { servicoId: "s1" })).status).toBe(422);
	});

	it("404 quando serviço não existe", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		servicos.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("os1", { servicoId: "sX" })).status).toBe(404);
	});

	it("422 quando serviço inativo", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		servicos.buscarPorId.mockResolvedValue({ id: "s1", ativo: false });
		expect((await makeSut().execute("os1", { servicoId: "s1" })).status).toBe(422);
	});

	it("201 cria item com quantidade default 1", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		servicos.buscarPorId.mockResolvedValue({ id: "s1", ativo: true, preco: 100 });
		const res = await makeSut().execute("os1", { servicoId: "s1" });
		expect(res.status).toBe(201);
		expect(gateway.criarItemServico).toHaveBeenCalledWith({
			ordemServicoId: "os1",
			servicoId: "s1",
			precoUnitario: 100,
			quantidade: 1,
		});
	});

	it("201 respeita quantidade informada", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		servicos.buscarPorId.mockResolvedValue({ id: "s1", ativo: true, preco: 50 });
		await makeSut().execute("os1", { servicoId: "s1", quantidade: 3 });
		expect(gateway.criarItemServico).toHaveBeenCalledWith(expect.objectContaining({ quantidade: 3 }));
	});
});
