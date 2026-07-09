import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { InsumosController } from "./insumos.controller";

describe("InsumosController", () => {
	const criarInsumo = { execute: jest.fn() };
	const listarInsumos = { execute: jest.fn() };
	const buscarInsumo = { execute: jest.fn() };
	const atualizarInsumo = { execute: jest.fn() };
	const inativarInsumo = { execute: jest.fn() };
	const registrarEntradaInsumo = { execute: jest.fn() };
	const ajustarEstoqueInsumo = { execute: jest.fn() };
	const listarMovimentosInsumo = { execute: jest.fn() };
	const alertasEstoqueBaixo = { execute: jest.fn() };
	let controller: InsumosController;
	const user = { id: "u1", email: "x@x", role: Role.ESTOQUISTA };

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new InsumosController(
			criarInsumo as any,
			listarInsumos as any,
			buscarInsumo as any,
			atualizarInsumo as any,
			inativarInsumo as any,
			registrarEntradaInsumo as any,
			ajustarEstoqueInsumo as any,
			listarMovimentosInsumo as any,
			alertasEstoqueBaixo as any,
		);
	});

	it("create delega", async () => {
		criarInsumo.execute.mockResolvedValueOnce({ status: 201 });
		await controller.create({ codigo: "P-001", nome: "Filtro", precoUnitario: 10 });
		expect(criarInsumo.execute).toHaveBeenCalled();
	});

	it("findAll delega", async () => {
		listarInsumos.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.findAll()).status).toBe(200);
	});

	it("alertas delega", async () => {
		alertasEstoqueBaixo.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.alertas()).status).toBe(200);
	});

	it("findOne delega", async () => {
		buscarInsumo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findOne("i1");
		expect(buscarInsumo.execute).toHaveBeenCalledWith("i1");
	});

	it("update delega", async () => {
		atualizarInsumo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.update("i1", { nome: "Z" });
		expect(atualizarInsumo.execute).toHaveBeenCalledWith("i1", { nome: "Z" });
	});

	it("remove delega", async () => {
		inativarInsumo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.remove("i1");
		expect(inativarInsumo.execute).toHaveBeenCalledWith("i1");
	});

	it("entrada delega passando user.id", async () => {
		registrarEntradaInsumo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.entrada("i1", { quantidade: 5 }, user);
		expect(registrarEntradaInsumo.execute).toHaveBeenCalledWith("i1", { quantidade: 5 }, "u1");
	});

	it("ajuste delega passando user.id", async () => {
		ajustarEstoqueInsumo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.ajuste("i1", { novaQuantidade: 9, motivo: "x" }, user);
		expect(ajustarEstoqueInsumo.execute).toHaveBeenCalledWith("i1", { novaQuantidade: 9, motivo: "x" }, "u1");
	});

	it("movimentos delega", async () => {
		listarMovimentosInsumo.execute.mockResolvedValueOnce({ status: 200 });
		await controller.movimentos("i1");
		expect(listarMovimentosInsumo.execute).toHaveBeenCalledWith("i1");
	});

	it("ajuste exige role ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, InsumosController.prototype.ajuste)).toEqual([Role.ADMINISTRADOR]);
	});

	it("entrada permite ESTOQUISTA e ADMINISTRADOR", () => {
		expect(Reflect.getMetadata(ROLES_KEY, InsumosController.prototype.entrada)).toEqual([Role.ESTOQUISTA, Role.ADMINISTRADOR]);
	});
});
