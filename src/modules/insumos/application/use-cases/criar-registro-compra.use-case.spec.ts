import { CriarRegistroCompraUseCase } from "./criar-registro-compra.use-case";

const gateway = { criar: jest.fn(), buscarDetalhePorId: jest.fn(), ordemServicoExiste: jest.fn() };
const insumos = { buscarPorId: jest.fn() };

describe("CriarRegistroCompraUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new CriarRegistroCompraUseCase(gateway as any, insumos as any);

	it("404 quando insumo não existe", async () => {
		insumos.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute({ insumoId: "i1", quantidadeSolicitada: 2 }, "u1")).status).toBe(404);
	});

	it("422 quando insumo está inativado", async () => {
		insumos.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: false });
		expect((await useCase().execute({ insumoId: "i1", quantidadeSolicitada: 2 }, "u1")).status).toBe(422);
	});

	it("404 quando ordemServicoId fornecida mas OS não existe", async () => {
		insumos.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true });
		gateway.ordemServicoExiste.mockResolvedValueOnce(false);
		const r = await useCase().execute({ insumoId: "i1", quantidadeSolicitada: 2, ordemServicoId: "os1" }, "u1");
		expect(r.status).toBe(404);
	});

	it("201 com ordemServicoId quando OS existe", async () => {
		insumos.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true });
		gateway.ordemServicoExiste.mockResolvedValueOnce(true);
		gateway.criar.mockResolvedValueOnce({ id: "rc1" });
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1" });
		const r = await useCase().execute({ insumoId: "i1", quantidadeSolicitada: 2, ordemServicoId: "os1" }, "u1");
		expect(r.status).toBe(201);
		expect(gateway.criar).toHaveBeenCalledWith(
			expect.objectContaining({ insumoId: "i1", solicitadoPorId: "u1", ordemServicoId: "os1" }),
		);
	});

	it("201 sem ordemServicoId", async () => {
		insumos.buscarPorId.mockResolvedValueOnce({ id: "i1", ativo: true });
		gateway.criar.mockResolvedValueOnce({ id: "rc1" });
		gateway.buscarDetalhePorId.mockResolvedValueOnce({ id: "rc1" });
		const r = await useCase().execute({ insumoId: "i1", quantidadeSolicitada: 2 }, "u1");
		expect(r.status).toBe(201);
		expect(gateway.ordemServicoExiste).not.toHaveBeenCalled();
	});
});
