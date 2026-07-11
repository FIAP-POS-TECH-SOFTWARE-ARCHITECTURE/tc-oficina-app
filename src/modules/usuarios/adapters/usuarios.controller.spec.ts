import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { UsuariosController } from "./usuarios.controller";

describe("UsuariosController", () => {
	const criarUsuario = { execute: jest.fn() };
	const listarUsuarios = { execute: jest.fn() };
	const buscarUsuario = { execute: jest.fn() };
	const atualizarUsuario = { execute: jest.fn() };
	const atualizarSenhaUsuario = { execute: jest.fn() };
	const inativarUsuario = { execute: jest.fn() };
	let controller: UsuariosController;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new UsuariosController(
			criarUsuario as any,
			listarUsuarios as any,
			buscarUsuario as any,
			atualizarUsuario as any,
			atualizarSenhaUsuario as any,
			inativarUsuario as any,
		);
	});

	it("create delega", async () => {
		criarUsuario.execute.mockResolvedValueOnce({ status: 201 });
		const dto = { nome: "X", email: "a@a", senha: "12345678", role: Role.ATENDENTE } as any;
		expect((await controller.create(dto)).status).toBe(201);
		expect(criarUsuario.execute).toHaveBeenCalledWith(dto);
	});

	it("findAll delega", async () => {
		listarUsuarios.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.findAll()).status).toBe(200);
	});

	it("findOne delega", async () => {
		buscarUsuario.execute.mockResolvedValueOnce({ status: 200 });
		expect((await controller.findOne("u1")).status).toBe(200);
		expect(buscarUsuario.execute).toHaveBeenCalledWith("u1");
	});

	it("update delega", async () => {
		atualizarUsuario.execute.mockResolvedValueOnce({ status: 200 });
		await controller.update("u1", { nome: "novo" });
		expect(atualizarUsuario.execute).toHaveBeenCalledWith("u1", { nome: "novo" });
	});

	it("updateSenha delega passando ator", async () => {
		atualizarSenhaUsuario.execute.mockResolvedValueOnce({ status: 200 });
		await controller.updateSenha("u1", { senha: "abcd1234" }, { id: "u9", email: "x@x", role: Role.ADMINISTRADOR });
		expect(atualizarSenhaUsuario.execute).toHaveBeenCalledWith("u1", { senha: "abcd1234" }, { id: "u9", role: Role.ADMINISTRADOR });
	});

	it("remove delega", async () => {
		inativarUsuario.execute.mockResolvedValueOnce({ status: 200 });
		await controller.remove("u1");
		expect(inativarUsuario.execute).toHaveBeenCalledWith("u1");
	});

	it("decorators @Roles(ADMINISTRADOR) presentes em endpoints administrativos", () => {
		for (const m of ["create", "findAll", "findOne", "update", "remove"] as const) {
			const meta = Reflect.getMetadata(ROLES_KEY, UsuariosController.prototype[m]);
			expect(meta).toEqual([Role.ADMINISTRADOR]);
		}
	});

	it("updateSenha não exige role administrativa", () => {
		const meta = Reflect.getMetadata(ROLES_KEY, UsuariosController.prototype.updateSenha);
		expect(meta).toBeUndefined();
	});
});
