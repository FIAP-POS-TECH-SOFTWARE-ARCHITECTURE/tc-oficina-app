import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { VeiculosController } from "./veiculos.controller";

describe("VeiculosController", () => {
	const criarVeiculo = { execute: jest.fn() };
	const listarVeiculosDoCliente = { execute: jest.fn() };
	const buscarVeiculo = { execute: jest.fn() };
	const buscarVeiculoPorPlaca = { execute: jest.fn() };
	const atualizarVeiculo = { execute: jest.fn() };
	const inativarVeiculo = { execute: jest.fn() };
	let controller: VeiculosController;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new VeiculosController(
			criarVeiculo as any,
			listarVeiculosDoCliente as any,
			buscarVeiculo as any,
			buscarVeiculoPorPlaca as any,
			atualizarVeiculo as any,
			inativarVeiculo as any,
		);
	});

	it("create delega clienteId+dto", async () => {
		criarVeiculo.execute.mockResolvedValueOnce({ status: 201 });
		await controller.create("c1", { placa: "ABC1234", marca: "X", modelo: "Y", ano: 2020 });
		expect(criarVeiculo.execute).toHaveBeenCalledWith("c1", expect.objectContaining({ placa: "ABC1234" }));
	});

	it("findByCliente delega", async () => {
		listarVeiculosDoCliente.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findByCliente("c1");
		expect(listarVeiculosDoCliente.execute).toHaveBeenCalledWith("c1");
	});

	it("findByPlaca delega", async () => {
		buscarVeiculoPorPlaca.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findByPlaca("ABC1234");
		expect(buscarVeiculoPorPlaca.execute).toHaveBeenCalledWith("ABC1234");
	});

	it("findOne delega id", async () => {
		buscarVeiculo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findOne("v1");
		expect(buscarVeiculo.execute).toHaveBeenCalledWith("v1");
	});

	it("update delega", async () => {
		atualizarVeiculo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.update("v1", { marca: "Z" });
		expect(atualizarVeiculo.execute).toHaveBeenCalledWith("v1", { marca: "Z" });
	});

	it("remove delega", async () => {
		inativarVeiculo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.remove("v1");
		expect(inativarVeiculo.execute).toHaveBeenCalledWith("v1");
	});

	it("@Roles em remove é apenas ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, VeiculosController.prototype.remove)).toEqual([Role.ADMINISTRADOR]);
	});
});
