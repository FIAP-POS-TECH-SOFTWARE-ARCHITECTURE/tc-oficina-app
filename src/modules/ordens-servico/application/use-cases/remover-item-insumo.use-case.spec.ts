import { OsStatus } from "../../domain/os-status";
import { RemoverItemInsumoUseCase } from "./remover-item-insumo.use-case";

const gateway = {
	buscarPorId: jest.fn(),
	buscarItemInsumo: jest.fn(),
	removerItemInsumo: jest.fn(),
	buscarDetalhePorId: jest.fn().mockResolvedValue({ id: "os1" }),
};

function makeSut() {
	return new RemoverItemInsumoUseCase(gateway as any);
}

describe("RemoverItemInsumoUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		gateway.buscarDetalhePorId.mockResolvedValue({ id: "os1" });
	});

	it("404 quando OS não existe", async () => {
		gateway.buscarPorId.mockResolvedValue(null);
		expect((await makeSut().execute("x", "it1")).status).toBe(404);
	});

	it("422 quando status não permite", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.AGUARDANDO_APROVACAO });
		expect((await makeSut().execute("os1", "it1")).status).toBe(422);
	});

	it("404 quando item de outra OS", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.RECEBIDA });
		gateway.buscarItemInsumo.mockResolvedValue({ id: "it1", ordemServicoId: "OUTRA" });
		expect((await makeSut().execute("os1", "it1")).status).toBe(404);
	});

	it("200 remove insumo", async () => {
		gateway.buscarPorId.mockResolvedValue({ id: "os1", status: OsStatus.EM_DIAGNOSTICO });
		gateway.buscarItemInsumo.mockResolvedValue({ id: "it1", ordemServicoId: "os1" });
		const res = await makeSut().execute("os1", "it1");
		expect(res.status).toBe(200);
		expect(gateway.removerItemInsumo).toHaveBeenCalledWith("it1");
	});
});
