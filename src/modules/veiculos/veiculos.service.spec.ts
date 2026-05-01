import { ClientesRepository } from "../clientes/clientes.repository";
import { VeiculosRepository } from "./veiculos.repository";
import { VeiculosService } from "./veiculos.service";

describe("VeiculosService", () => {
	let repo: jest.Mocked<VeiculosRepository>;
	let clientes: jest.Mocked<ClientesRepository>;
	let service: VeiculosService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByPlaca: jest.fn(),
			findByCliente: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn(),
			hasOrdensAbertas: jest.fn(),
		} as unknown as jest.Mocked<VeiculosRepository>;
		clientes = { findById: jest.fn() } as unknown as jest.Mocked<ClientesRepository>;
		service = new VeiculosService(repo, clientes);
	});

	describe("create", () => {
		it("404 quando cliente não existe", async () => {
			clientes.findById.mockResolvedValueOnce(null);
			const r = await service.create("c1", { placa: "ABC1234", marca: "X", modelo: "Y", ano: 2020 });
			expect(r.status).toBe(404);
		});

		it("409 quando placa já cadastrada", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1" } as any);
			repo.findByPlaca.mockResolvedValueOnce({ id: "v1" } as any);
			const r = await service.create("c1", { placa: "abc1234", marca: "X", modelo: "Y", ano: 2020 });
			expect(r.status).toBe(409);
		});

		it("201 normaliza placa e cria", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1" } as any);
			repo.findByPlaca.mockResolvedValueOnce(null);
			repo.create.mockResolvedValueOnce({ id: "v1" } as any);
			const r = await service.create("c1", { placa: "abc-1234", marca: "X", modelo: "Y", ano: 2020 });
			expect(r.status).toBe(201);
			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({ placa: "ABC1234", clienteId: "c1" }),
			);
		});
	});

	describe("findByCliente", () => {
		it("404 quando cliente não existe", async () => {
			clientes.findById.mockResolvedValueOnce(null);
			expect((await service.findByCliente("c1")).status).toBe(404);
		});

		it("200 lista veículos do cliente", async () => {
			clientes.findById.mockResolvedValueOnce({ id: "c1" } as any);
			repo.findByCliente.mockResolvedValueOnce([{ id: "v1" }] as any);
			expect((await service.findByCliente("c1")).status).toBe(200);
		});
	});

	describe("findById/findByPlaca", () => {
		it("findById 404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.findById("x")).status).toBe(404);
		});

		it("findById 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "v1" } as any);
			expect((await service.findById("v1")).status).toBe(200);
		});

		it("findByPlaca normaliza e 404", async () => {
			repo.findByPlaca.mockResolvedValueOnce(null);
			const r = await service.findByPlaca("abc-1234");
			expect(r.status).toBe(404);
			expect(repo.findByPlaca).toHaveBeenCalledWith("ABC1234");
		});

		it("findByPlaca 200", async () => {
			repo.findByPlaca.mockResolvedValueOnce({ id: "v1" } as any);
			expect((await service.findByPlaca("ABC1234")).status).toBe(200);
		});
	});

	describe("update", () => {
		it("404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.update("x", {} as any)).status).toBe(404);
		});

		it("200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "v1" } as any);
			repo.update.mockResolvedValueOnce({ id: "v1" } as any);
			expect((await service.update("v1", { marca: "X" } as any)).status).toBe(200);
		});
	});

	describe("remove", () => {
		it("404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.remove("x")).status).toBe(404);
		});

		it("409 quando há ordens abertas", async () => {
			repo.findById.mockResolvedValueOnce({ id: "v1" } as any);
			repo.hasOrdensAbertas.mockResolvedValueOnce(1);
			expect((await service.remove("v1")).status).toBe(409);
		});

		it("200 inativa", async () => {
			repo.findById.mockResolvedValueOnce({ id: "v1" } as any);
			repo.hasOrdensAbertas.mockResolvedValueOnce(0);
			repo.softDelete.mockResolvedValueOnce({ id: "v1", ativo: false } as any);
			expect((await service.remove("v1")).status).toBe(200);
		});
	});
});
