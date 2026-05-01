import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { RegistrosCompraController } from "./registros-compra.controller";
import { RegistrosCompraService } from "./registros-compra.service";

describe("RegistrosCompraController", () => {
	let service: jest.Mocked<RegistrosCompraService>;
	let controller: RegistrosCompraController;
	const user = { id: "u1", email: "x@x", role: Role.ESTOQUISTA };

	beforeEach(() => {
		service = {
			create: jest.fn(),
			list: jest.fn(),
			findById: jest.fn(),
			enviarFornecedor: jest.fn(),
			registrarRespostaFornecedor: jest.fn(),
			cancelar: jest.fn(),
			receber: jest.fn(),
		} as unknown as jest.Mocked<RegistrosCompraService>;
		controller = new RegistrosCompraController(service);
	});

	it("create delega passando user.id", async () => {
		service.create.mockResolvedValueOnce({ status: 201 } as any);
		await controller.create({ insumoId: "i1", quantidadeSolicitada: 10 } as any, user as any);
		expect(service.create).toHaveBeenCalledWith({ insumoId: "i1", quantidadeSolicitada: 10 }, "u1");
	});

	it("list delega", async () => {
		service.list.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.list()).status).toBe(200);
	});

	it("findOne delega", async () => {
		service.findById.mockResolvedValueOnce({ status: 200 } as any);
		await controller.findOne("rc1");
		expect(service.findById).toHaveBeenCalledWith("rc1");
	});

	it("enviarFornecedor delega", async () => {
		service.enviarFornecedor.mockResolvedValueOnce({ status: 200 } as any);
		await controller.enviarFornecedor("rc1");
		expect(service.enviarFornecedor).toHaveBeenCalledWith("rc1");
	});

	it("respostaFornecedor delega", async () => {
		service.registrarRespostaFornecedor.mockResolvedValueOnce({ status: 200 } as any);
		await controller.respostaFornecedor("rc1", { aprovado: true } as any);
		expect(service.registrarRespostaFornecedor).toHaveBeenCalledWith("rc1", { aprovado: true });
	});

	it("cancelar delega", async () => {
		service.cancelar.mockResolvedValueOnce({ status: 200 } as any);
		await controller.cancelar("rc1", { motivo: "x" } as any);
		expect(service.cancelar).toHaveBeenCalledWith("rc1", { motivo: "x" });
	});

	it("receber delega passando user.id", async () => {
		service.receber.mockResolvedValueOnce({ status: 200 } as any);
		await controller.receber("rc1", { notaFiscalNumero: "NF-1" } as any, user as any);
		expect(service.receber).toHaveBeenCalledWith("rc1", { notaFiscalNumero: "NF-1" }, "u1");
	});

	it("todos endpoints exigem ESTOQUISTA ou ADMINISTRADOR", () => {
		const expected = [Role.ESTOQUISTA, Role.ADMINISTRADOR];
		for (const m of [
			"create",
			"list",
			"findOne",
			"enviarFornecedor",
			"respostaFornecedor",
			"cancelar",
			"receber",
		] as const) {
			expect(Reflect.getMetadata(ROLES_KEY, RegistrosCompraController.prototype[m])).toEqual(expected);
		}
	});
});
