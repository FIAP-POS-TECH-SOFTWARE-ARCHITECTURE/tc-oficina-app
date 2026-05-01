import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { VeiculosController } from "./veiculos.controller";
import { VeiculosService } from "./veiculos.service";

describe("VeiculosController", () => {
	let service: jest.Mocked<VeiculosService>;
	let controller: VeiculosController;

	beforeEach(() => {
		service = {
			create: jest.fn(),
			findById: jest.fn(),
			findByPlaca: jest.fn(),
			findByCliente: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
		} as unknown as jest.Mocked<VeiculosService>;
		controller = new VeiculosController(service);
	});

	it("create delega clienteId+dto", async () => {
		service.create.mockResolvedValueOnce({ status: 201 } as any);
		await controller.create("c1", { placa: "ABC1234", marca: "X", modelo: "Y", ano: 2020 } as any);
		expect(service.create).toHaveBeenCalledWith("c1", expect.objectContaining({ placa: "ABC1234" }));
	});

	it("findByCliente delega", async () => {
		service.findByCliente.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findByCliente("c1");
		expect(service.findByCliente).toHaveBeenCalledWith("c1");
	});

	it("findByPlaca delega", async () => {
		service.findByPlaca.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findByPlaca("ABC1234");
		expect(service.findByPlaca).toHaveBeenCalledWith("ABC1234");
	});

	it("findOne delega id", async () => {
		service.findById.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findOne("v1");
		expect(service.findById).toHaveBeenCalledWith("v1");
	});

	it("update delega", async () => {
		service.update.mockResolvedValueOnce({ status: 200 } as any);
		await controller.update("v1", { marca: "Z" } as any);
		expect(service.update).toHaveBeenCalledWith("v1", { marca: "Z" });
	});

	it("remove delega", async () => {
		service.remove.mockResolvedValueOnce({ status: 200 } as any);
		await controller.remove("v1");
		expect(service.remove).toHaveBeenCalledWith("v1");
	});

	it("@Roles em remove é apenas ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, VeiculosController.prototype.remove)).toEqual([Role.ADMINISTRADOR]);
	});
});
