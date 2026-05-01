import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { ClientesController } from "./clientes.controller";
import { ClientesService } from "./clientes.service";

describe("ClientesController", () => {
	let service: jest.Mocked<ClientesService>;
	let controller: ClientesController;

	beforeEach(() => {
		service = {
			create: jest.fn(),
			findAll: jest.fn(),
			findById: jest.fn(),
			findByDocumento: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
		} as unknown as jest.Mocked<ClientesService>;
		controller = new ClientesController(service);
	});

	it("create delega", async () => {
		service.create.mockResolvedValueOnce({ status: 201 } as any);
		await controller.create({ nome: "X", documento: "529.982.247-25" } as any);
		expect(service.create).toHaveBeenCalled();
	});

	it("findAll delega", async () => {
		service.findAll.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.findAll()).status).toBe(200);
	});

	it("findByDocumento delega documento", async () => {
		service.findByDocumento.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findByDocumento("52998224725");
		expect(service.findByDocumento).toHaveBeenCalledWith("52998224725");
	});

	it("findOne delega id", async () => {
		service.findById.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findOne("c1");
		expect(service.findById).toHaveBeenCalledWith("c1");
	});

	it("update delega", async () => {
		service.update.mockResolvedValueOnce({ status: 200 } as any);
		await controller.update("c1", { nome: "X" } as any);
		expect(service.update).toHaveBeenCalledWith("c1", { nome: "X" });
	});

	it("remove delega", async () => {
		service.remove.mockResolvedValueOnce({ status: 200 } as any);
		await controller.remove("c1");
		expect(service.remove).toHaveBeenCalledWith("c1");
	});

	it("@Roles em remove é apenas ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, ClientesController.prototype.remove)).toEqual([Role.ADMINISTRADOR]);
	});

	it("@Roles em create permite ATENDENTE e ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, ClientesController.prototype.create)).toEqual([
			Role.ATENDENTE,
			Role.ADMINISTRADOR,
		]);
	});
});
