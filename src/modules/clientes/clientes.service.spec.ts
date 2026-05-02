import { TipoDocumentoCliente } from "@prisma/client";
import { ClientesRepository } from "./clientes.repository";
import { ClientesService } from "./clientes.service";

describe("ClientesService", () => {
	let repo: jest.Mocked<ClientesRepository>;
	let service: ClientesService;

	beforeEach(() => {
		repo = {
			create: jest.fn(),
			findById: jest.fn(),
			findByDocumento: jest.fn(),
			findAll: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn(),
			hasOrdensAbertas: jest.fn(),
		} as unknown as jest.Mocked<ClientesRepository>;
		service = new ClientesService(repo);
	});

	describe("create", () => {
		it("409 quando documento já existe", async () => {
			repo.findByDocumento.mockResolvedValueOnce({ id: "x" } as any);
			const r = await service.create({
				nome: "X",
				documento: "529.982.247-25",
			});
			expect(r.status).toBe(409);
		});

		it("201 e tipoDocumento=CPF quando documento tem 11 dígitos", async () => {
			repo.findByDocumento.mockResolvedValueOnce(null);
			repo.create.mockResolvedValueOnce({ id: "1" } as any);
			const r = await service.create({
				nome: "X",
				documento: "529.982.247-25",
			});
			expect(r.status).toBe(201);
			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({ tipoDocumento: TipoDocumentoCliente.CPF, documento: "52998224725" }),
			);
		});

		it("201 e tipoDocumento=CNPJ quando documento tem 14 dígitos", async () => {
			repo.findByDocumento.mockResolvedValueOnce(null);
			repo.create.mockResolvedValueOnce({ id: "1" } as any);
			const r = await service.create({
				nome: "Empresa",
				documento: "11.444.777/0001-61",
			});
			expect(r.status).toBe(201);
			expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tipoDocumento: TipoDocumentoCliente.CNPJ }));
		});
	});

	describe("findAll/findById/findByDocumento", () => {
		it("findAll devolve lista", async () => {
			repo.findAll.mockResolvedValueOnce([{ id: "1" }] as any);
			const r = await service.findAll();
			expect(r.status).toBe(200);
		});

		it("findById 404", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.findById("x")).status).toBe(404);
		});

		it("findById 200", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1" } as any);
			expect((await service.findById("1")).status).toBe(200);
		});

		it("findByDocumento normaliza e 404 quando não acha", async () => {
			repo.findByDocumento.mockResolvedValueOnce(null);
			const r = await service.findByDocumento("529.982.247-25");
			expect(r.status).toBe(404);
			expect(repo.findByDocumento).toHaveBeenCalledWith("52998224725");
		});

		it("findByDocumento 200", async () => {
			repo.findByDocumento.mockResolvedValueOnce({ id: "1" } as any);
			expect((await service.findByDocumento("52998224725")).status).toBe(200);
		});
	});

	describe("update", () => {
		it("404 quando cliente não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.update("x", { nome: "y" })).status).toBe(404);
		});

		it("200 atualiza", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1" } as any);
			repo.update.mockResolvedValueOnce({ id: "1" } as any);
			expect((await service.update("1", { nome: "y" })).status).toBe(200);
		});

		it("422 quando cliente está inativado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1", ativo: false } as any);
			expect((await service.update("1", { nome: "y" })).status).toBe(422);
		});
	});

	describe("remove", () => {
		it("404 quando cliente não existe", async () => {
			repo.findById.mockResolvedValueOnce(null);
			expect((await service.remove("x")).status).toBe(404);
		});

		it("409 quando há ordens abertas", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1" } as any);
			repo.hasOrdensAbertas.mockResolvedValueOnce(2);
			expect((await service.remove("1")).status).toBe(409);
		});

		it("200 inativa quando não há ordens abertas", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1" } as any);
			repo.hasOrdensAbertas.mockResolvedValueOnce(0);
			repo.softDelete.mockResolvedValueOnce({ id: "1", ativo: false } as any);
			expect((await service.remove("1")).status).toBe(200);
		});

		it("422 quando cliente já está inativado", async () => {
			repo.findById.mockResolvedValueOnce({ id: "1", ativo: false } as any);
			expect((await service.remove("1")).status).toBe(422);
		});
	});
});
