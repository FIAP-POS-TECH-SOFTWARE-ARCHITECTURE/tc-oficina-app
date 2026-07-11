import { OsStatus } from "../../domain/os-status";
import { AddItemInsumoUseCase } from "./add-item-insumo.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	criarItemInsumo: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};
const insumos = { buscarPorId: jest.fn() };

function makeSut() {
	return new AddItemInsumoUseCase(gateway as any, insumos);
}

describe("AddItemInsumoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", { insumoId: "i1", quantidade: 1 })).status).toBe(404);
	});

	it("422 quando status não permite", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_EXECUCAO });
		expect((await makeSut().execute("os1", { insumoId: "i1", quantidade: 1 })).status).toBe(422);
	});

	it("404 quando insumo não existe", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		insumos.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("os1", { insumoId: "iX", quantidade: 1 })).status).toBe(404);
	});

	it("422 quando insumo inativo", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		insumos.buscarPorId.mockResolvedValue({ id: "i1", ativo: false, quantidadeEstoque: 10 });
		expect((await makeSut().execute("os1", { insumoId: "i1", quantidade: 1 })).status).toBe(422);
	});

	it("422 quando estoque insuficiente", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		insumos.buscarPorId.mockResolvedValue({ id: "i1", ativo: true, quantidadeEstoque: 2, precoUnitario: 5 });
		const res = await makeSut().execute("os1", { insumoId: "i1", quantidade: 5 });
		expect(res.status).toBe(422);
		expect(res.message).toContain("Disponível: 2");
	});

	it("201 adiciona insumo", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		insumos.buscarPorId.mockResolvedValue({ id: "i1", ativo: true, quantidadeEstoque: 10, precoUnitario: 5 });
		const res = await makeSut().execute("os1", { insumoId: "i1", quantidade: 3 });
		expect(res.status).toBe(201);
		expect(gateway.criarItemInsumo).toHaveBeenCalledWith({
			ordemServicoId: "os1",
			insumoId: "i1",
			precoUnitario: 5,
			quantidade: 3,
		});
	});
});
