import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { ClientesController } from "./clientes.controller";

describe("ClientesController", () => {
	const criarCliente = { execute: jest.fn() };
	const listarClientes = { execute: jest.fn() };
	const buscarCliente = { execute: jest.fn() };
	const buscarClientePorDocumento = { execute: jest.fn() };
	const atualizarCliente = { execute: jest.fn() };
	const inativarCliente = { execute: jest.fn() };
	let controller: ClientesController;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new ClientesController(
			criarCliente as any,
			listarClientes as any,
			buscarCliente as any,
			buscarClientePorDocumento as any,
			atualizarCliente as any,
			inativarCliente as any,
		);
	});

	it("create delega", async () => {
		criarCliente.execute.mockResolvedValueOnce({ status: 201 });
		await controller.create({ nome: "X", documento: "529.982.247-25" });
		expect(criarCliente.execute).toHaveBeenCalled();
	});

	it("findAll delega", async () => {
		listarClientes.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.findAll()).status).toBe(200);
	});

	it("findByDocumento delega documento", async () => {
		buscarClientePorDocumento.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findByDocumento("52998224725");
		expect(buscarClientePorDocumento.execute).toHaveBeenCalledWith("52998224725");
	});

	it("findOne delega id", async () => {
		buscarCliente.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findOne("c1");
		expect(buscarCliente.execute).toHaveBeenCalledWith("c1");
	});

	it("update delega", async () => {
		atualizarCliente.execute.mockResolvedValueOnce({ status: 200 });
		await controller.update("c1", { nome: "X" });
		expect(atualizarCliente.execute).toHaveBeenCalledWith("c1", { nome: "X" });
	});

	it("remove delega", async () => {
		inativarCliente.execute.mockResolvedValueOnce({ status: 200 });
		await controller.remove("c1");
		expect(inativarCliente.execute).toHaveBeenCalledWith("c1");
	});

	it("@Roles em remove é apenas ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, ClientesController.prototype.remove)).toEqual([Role.ADMINISTRADOR]);
	});

	it("@Roles em create permite ATENDENTE e ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, ClientesController.prototype.create)).toEqual([Role.ATENDENTE, Role.ADMINISTRADOR]);
	});
});
