import { ServicosRepository } from "./servicos.repository";
import { ServicosService } from "./servicos.service";

describe("ServicosService", () => {
	let repo: jest.Mocked<ServicosRepository>;
	let service: ServicosService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByNome: jest.fn(),
			findAll: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn(),
		} as unknown as jest.Mocked<ServicosRepository>;
		service = new ServicosService(repo);
	});

	describe("create", () => {
		it("409 quando nome duplicado", async () => {
			repo.findByNome.mockResolvedValueOnce({ id: "x" } as any);
			expect(
				(await service.create({ nome: "Troca de óleo", preco: 50, tempoEstimadoMin: 30 } as any)).status,
			).toBe(409);
		});

		it("201 quando criado", async () => {
			repo.findByNome.mockResolvedValueOnce(null);
			repo.create.mockResolvedValueOnce({ id: "s1" } as any);
			expect(
				(await service.create({ nome: "Troca de óleo", preco: 50, tempoEstimadoMin: 30 } as any)).status,
			).toBe(201);
		});
	});

	describe("findAll/findById", () => {
		it("findAll 200", async () => {
			repo.findAll.mockResolvedValueOnce([{ id: "s1" }] as any);
			expect((await service.findAll()).status).toBe(200);
		});

		it("findById 404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.findById("x")).status).toBe(404);
		});

		it("findById 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "s1" } as any);
			expect((await service.findById("s1")).status).toBe(200);
		});
	});

	describe("update", () => {
		it("404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.update("x", { nome: "novo" } as any)).status).toBe(404);
		});

		it("409 quando rename para nome existente", async () => {
			repo.findById.mockResolvedValueOnce({ id: "s1", nome: "antigo" } as any);
			repo.findByNome.mockResolvedValueOnce({ id: "s2" } as any);
			expect((await service.update("s1", { nome: "novo" } as any)).status).toBe(409);
		});

		it("200 atualiza sem trocar nome", async () => {
			repo.findById.mockResolvedValueOnce({ id: "s1", nome: "antigo" } as any);
			repo.update.mockResolvedValueOnce({ id: "s1" } as any);
			expect((await service.update("s1", { preco: 99 } as any)).status).toBe(200);
		});

		it("200 quando rename para mesmo nome (sem conflict)", async () => {
			repo.findById.mockResolvedValueOnce({ id: "s1", nome: "antigo" } as any);
			repo.update.mockResolvedValueOnce({ id: "s1" } as any);
			expect((await service.update("s1", { nome: "antigo" } as any)).status).toBe(200);
		});
	});

	describe("remove", () => {
		it("404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.remove("x")).status).toBe(404);
		});

		it("200 inativa", async () => {
			repo.findById.mockResolvedValueOnce({ id: "s1" } as any);
			repo.softDelete.mockResolvedValueOnce({ id: "s1", ativo: false } as any);
			expect((await service.remove("s1")).status).toBe(200);
		});
	});
});
