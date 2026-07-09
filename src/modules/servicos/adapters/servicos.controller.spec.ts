import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { ServicosController } from "./servicos.controller";

describe("ServicosController", () => {
	const criarServico = { execute: jest.fn() };
	const listarServicos = { execute: jest.fn() };
	const buscarServico = { execute: jest.fn() };
	const atualizarServico = { execute: jest.fn() };
	const inativarServico = { execute: jest.fn() };
	let controller: ServicosController;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new ServicosController(
			criarServico as any,
			listarServicos as any,
			buscarServico as any,
			atualizarServico as any,
			inativarServico as any,
		);
	});

	it("create delega", async () => {
		criarServico.execute.mockResolvedValueOnce({ status: 201 });
		await controller.create({ nome: "X", preco: 10, tempoEstimadoMin: 30 });
		expect(criarServico.execute).toHaveBeenCalled();
	});

	it("findAll delega", async () => {
		listarServicos.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.findAll()).status).toBe(200);
	});

	it("findOne delega", async () => {
		buscarServico.execute.mockResolvedValueOnce({ status: 200 });
		await controller.findOne("s1");
		expect(buscarServico.execute).toHaveBeenCalledWith("s1");
	});

	it("update delega", async () => {
		atualizarServico.execute.mockResolvedValueOnce({ status: 200 });
		await controller.update("s1", { preco: 99 });
		expect(atualizarServico.execute).toHaveBeenCalledWith("s1", { preco: 99 });
	});

	it("remove delega", async () => {
		inativarServico.execute.mockResolvedValueOnce({ status: 200 });
		await controller.remove("s1");
		expect(inativarServico.execute).toHaveBeenCalledWith("s1");
	});

	it("create/update/remove restritos a ADMINISTRADOR", () => {
		for (const m of ["create", "update", "remove"] as const) {
			expect(Reflect.getMetadata(ROLES_KEY, ServicosController.prototype[m])).toEqual([Role.ADMINISTRADOR]);
		}
	});
});
