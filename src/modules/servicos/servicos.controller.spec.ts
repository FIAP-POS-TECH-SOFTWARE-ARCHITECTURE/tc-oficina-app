import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { ServicosController } from "./servicos.controller";
import { ServicosService } from "./servicos.service";

describe("ServicosController", () => {
	let service: jest.Mocked<ServicosService>;
	let controller: ServicosController;

	beforeEach(() => {
		service = {
			create: jest.fn(),
			findAll: jest.fn(),
			findById: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
		} as unknown as jest.Mocked<ServicosService>;
		controller = new ServicosController(service);
	});

	it("create delega", async () => {
		service.create.mockResolvedValueOnce({ status: 201 } as any);
		await controller.create({ nome: "X", preco: 10, tempoEstimadoMin: 30 } as any);
		expect(service.create).toHaveBeenCalled();
	});

	it("findAll delega", async () => {
		service.findAll.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.findAll()).status).toBe(200);
	});

	it("findOne delega", async () => {
		service.findById.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findOne("s1");
		expect(service.findById).toHaveBeenCalledWith("s1");
	});

	it("update delega", async () => {
		service.update.mockResolvedValueOnce({ status: 200 } as any);
		await controller.update("s1", { preco: 99 } as any);
		expect(service.update).toHaveBeenCalledWith("s1", { preco: 99 });
	});

	it("remove delega", async () => {
		service.remove.mockResolvedValueOnce({ status: 200 } as any);
		await controller.remove("s1");
		expect(service.remove).toHaveBeenCalledWith("s1");
	});

	it("create/update/remove restritos a ADMINISTRADOR", () => {
		for (const m of ["create", "update", "remove"] as const) {
			expect(Reflect.getMetadata(ROLES_KEY, ServicosController.prototype[m])).toEqual([Role.ADMINISTRADOR]);
		}
	});
});
