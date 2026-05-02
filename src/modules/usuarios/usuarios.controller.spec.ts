import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { UsuariosController } from "./usuarios.controller";
import { UsuariosService } from "./usuarios.service";

describe("UsuariosController", () => {
	let service: jest.Mocked<UsuariosService>;
	let controller: UsuariosController;

	beforeEach(() => {
		service = {
			create: jest.fn(),
			findAll: jest.fn(),
			findById: jest.fn(),
			update: jest.fn(),
			updateSenha: jest.fn(),
			remove: jest.fn(),
		} as unknown as jest.Mocked<UsuariosService>;
		controller = new UsuariosController(service);
	});

	it("create delega", async () => {
		service.create.mockResolvedValueOnce({ status: 201 } as any);
		const dto = { nome: "X", email: "a@a", senha: "12345678", role: Role.ATENDENTE } as any;
		expect((await controller.create(dto)).status).toBe(201);
		expect(service.create).toHaveBeenCalledWith(dto);
	});

	it("findAll delega", async () => {
		service.findAll.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.findAll()).status).toBe(200);
	});

	it("findOne delega", async () => {
		service.findById.mockResolvedValueOnce({ status: 200 } as any);
		expect((await controller.findOne("u1")).status).toBe(200);
		expect(service.findById).toHaveBeenCalledWith("u1");
	});

	it("update delega", async () => {
		service.update.mockResolvedValueOnce({ status: 200 } as any);
		await controller.update("u1", { nome: "novo" });
		expect(service.update).toHaveBeenCalledWith("u1", { nome: "novo" });
	});

	it("updateSenha delega passando ator", async () => {
		service.updateSenha.mockResolvedValueOnce({ status: 200 } as any);
		await controller.updateSenha(
			"u1",
			{ senha: "abcd1234" },
			{
				id: "u9",
				email: "x@x",
				role: Role.ADMINISTRADOR,
			},
		);
		expect(service.updateSenha).toHaveBeenCalledWith("u1", { senha: "abcd1234" }, { id: "u9", role: Role.ADMINISTRADOR });
	});

	it("remove delega", async () => {
		service.remove.mockResolvedValueOnce({ status: 200 } as any);
		await controller.remove("u1");
		expect(service.remove).toHaveBeenCalledWith("u1");
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
