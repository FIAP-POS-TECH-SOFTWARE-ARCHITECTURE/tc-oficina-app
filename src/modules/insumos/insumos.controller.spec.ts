import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { InsumosController } from "./insumos.controller";
import { InsumosService } from "./insumos.service";

describe("InsumosController", () => {
	let service: jest.Mocked<InsumosService>;
	let controller: InsumosController;
	const user = { id: "u1", email: "x@x", role: Role.ESTOQUISTA };

	beforeEach(() => {
		service = {
			create: jest.fn(),
			findAll: jest.fn(),
			findById: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
			entrada: jest.fn(),
			ajuste: jest.fn(),
			alertasEstoqueBaixo: jest.fn(),
			listarMovimentos: jest.fn(),
		} as unknown as jest.Mocked<InsumosService>;
		controller = new InsumosController(service);
	});

	it("create delega", async () => {
		service.create.mockResolvedValueOnce({ status: 201 } as any);
		await controller.create({ codigo: "P-001", nome: "Filtro", precoUnitario: 10 } as any);
		expect(service.create).toHaveBeenCalled();
	});

	it("findAll delega", async () => {
		service.findAll.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.findAll()).status).toBe(200);
	});

	it("alertas delega", async () => {
		service.alertasEstoqueBaixo.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.alertas()).status).toBe(200);
	});

	it("findOne delega", async () => {
		service.findById.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findOne("i1");
		expect(service.findById).toHaveBeenCalledWith("i1");
	});

	it("update delega", async () => {
		service.update.mockResolvedValueOnce({ status: 200 } as any);
		await controller.update("i1", { nome: "Z" } as any);
		expect(service.update).toHaveBeenCalledWith("i1", { nome: "Z" });
	});

	it("remove delega", async () => {
		service.remove.mockResolvedValueOnce({ status: 200 } as any);
		await controller.remove("i1");
		expect(service.remove).toHaveBeenCalledWith("i1");
	});

	it("entrada delega passando user.id", async () => {
		service.entrada.mockResolvedValueOnce({ status: 200 } as any);
		await controller.entrada("i1", { quantidade: 5 } as any, user as any);
		expect(service.entrada).toHaveBeenCalledWith("i1", { quantidade: 5 }, "u1");
	});

	it("ajuste delega passando user.id", async () => {
		service.ajuste.mockResolvedValueOnce({ status: 200 } as any);
		await controller.ajuste("i1", { novaQuantidade: 9, motivo: "x" } as any, user as any);
		expect(service.ajuste).toHaveBeenCalledWith("i1", { novaQuantidade: 9, motivo: "x" }, "u1");
	});

	it("movimentos delega", async () => {
		service.listarMovimentos.mockResolvedValueOnce({ status: 200 } as any);
		await controller.movimentos("i1");
		expect(service.listarMovimentos).toHaveBeenCalledWith("i1");
	});

	it("ajuste exige role ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, InsumosController.prototype.ajuste)).toEqual([Role.ADMINISTRADOR]);
	});

	it("entrada permite ESTOQUISTA e ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, InsumosController.prototype.entrada)).toEqual([
			Role.ESTOQUISTA,
			Role.ADMINISTRADOR,
		]);
	});
});
