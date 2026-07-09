import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { RegistrosCompraController } from "./registros-compra.controller";

describe("RegistrosCompraController", () => {
	const criarRegistroCompra = { execute: jest.fn() };
	const listarRegistrosCompra = { execute: jest.fn() };
	const buscarRegistroCompra = { execute: jest.fn() };
	const enviarFornecedorUc = { execute: jest.fn() };
	const registrarRespostaFornecedorUc = { execute: jest.fn() };
	const cancelarRegistroCompra = { execute: jest.fn() };
	const receberCompra = { execute: jest.fn() };
	let controller: RegistrosCompraController;
	const user = { id: "u1", email: "x@x", role: Role.ESTOQUISTA };

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new RegistrosCompraController(
			criarRegistroCompra as any,
			listarRegistrosCompra as any,
			buscarRegistroCompra as any,
			enviarFornecedorUc as any,
			registrarRespostaFornecedorUc as any,
			cancelarRegistroCompra as any,
			receberCompra as any,
		);
	});

	it("create delega passando user.id", async () => {
		criarRegistroCompra.execute.mockResolvedValueOnce({ status: 201 });
		await controller.create({ insumoId: "i1", quantidadeSolicitada: 10 }, user);
		expect(criarRegistroCompra.execute).toHaveBeenCalledWith({ insumoId: "i1", quantidadeSolicitada: 10 }, "u1");
	});

	it("list delega", async () => {
		listarRegistrosCompra.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.list()).status).toBe(200);
	});

	it("findOne delega", async () => {
		buscarRegistroCompra.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findOne("rc1");
		expect(buscarRegistroCompra.execute).toHaveBeenCalledWith("rc1");
	});

	it("enviarFornecedor delega", async () => {
		enviarFornecedorUc.execute.mockResolvedValueOnce({ status: 200 });
		await controller.enviarFornecedor("rc1");
		expect(enviarFornecedorUc.execute).toHaveBeenCalledWith("rc1");
	});

	it("respostaFornecedor delega", async () => {
		registrarRespostaFornecedorUc.execute.mockResolvedValueOnce({ status: 200 });
		await controller.respostaFornecedor("rc1", { aprovado: true });
		expect(registrarRespostaFornecedorUc.execute).toHaveBeenCalledWith("rc1", { aprovado: true });
	});

	it("cancelar delega", async () => {
		cancelarRegistroCompra.execute.mockResolvedValueOnce({ status: 200 });
		await controller.cancelar("rc1", { motivo: "x" });
		expect(cancelarRegistroCompra.execute).toHaveBeenCalledWith("rc1", { motivo: "x" });
	});

	it("receber delega passando user.id", async () => {
		receberCompra.execute.mockResolvedValueOnce({ status: 200 });
		await controller.receber("rc1", { notaFiscalNumero: "NF-1" } as any, user);
		expect(receberCompra.execute).toHaveBeenCalledWith("rc1", { notaFiscalNumero: "NF-1" }, "u1");
	});

	it("todos endpoints exigem ESTOQUISTA ou ADMINISTRADOR", () => {
		const expected = [Role.ESTOQUISTA, Role.ADMINISTRADOR];
		for (const m of ["create", "list", "findOne", "enviarFornecedor", "respostaFornecedor", "cancelar", "receber"] as const) {
			expect(Reflect.getMetadata(ROLES_KEY, RegistrosCompraController.prototype[m])).toEqual(expected);
		}
	});
});
