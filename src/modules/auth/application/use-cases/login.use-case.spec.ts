import { Role } from "../../../../common/enums/role.enum";
import { LoginUseCase } from "./login.use-case";

const usuarios = { buscarPorEmail: jest.fn() };
const hasher = { hash: jest.fn(), verificar: jest.fn() };
const token = { gerarToken: jest.fn() };

const usuarioAtivo = {
	id: "1",
	nome: "Fulano",
	email: "x@x.com",
	senhaHash: "hash",
	ativo: true,
	role: Role.ATENDENTE,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("LoginUseCase", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		token.gerarToken.mockResolvedValue("token-123");
	});

	const useCase = () => new LoginUseCase(usuarios as any, hasher as any, token as any);

	it("retorna 401 se usuário não existe", async () => {
		usuarios.buscarPorEmail.mockResolvedValueOnce(null);
		const r = await useCase().execute({ email: "x@x.com", senha: "abc" });
		expect(r.status).toBe(401);
	});

	it("retorna 401 se usuário inativo", async () => {
		usuarios.buscarPorEmail.mockResolvedValueOnce({ ...usuarioAtivo, ativo: false });
		const r = await useCase().execute({ email: "x@x.com", senha: "abc" });
		expect(r.status).toBe(401);
		expect(hasher.verificar).not.toHaveBeenCalled();
	});

	it("retorna 401 se senha inválida", async () => {
		usuarios.buscarPorEmail.mockResolvedValueOnce(usuarioAtivo);
		hasher.verificar.mockResolvedValueOnce(false);
		const r = await useCase().execute({ email: "x@x.com", senha: "errada" });
		expect(r.status).toBe(401);
		expect(hasher.verificar).toHaveBeenCalledWith("hash", "errada");
	});

	it("retorna 200 com accessToken se senha correta", async () => {
		usuarios.buscarPorEmail.mockResolvedValueOnce(usuarioAtivo);
		hasher.verificar.mockResolvedValueOnce(true);
		const r = await useCase().execute({ email: "x@x.com", senha: "certa" });
		expect(r.status).toBe(200);
		expect(r.data?.accessToken).toBe("token-123");
		expect(r.data?.user.email).toBe("x@x.com");
		expect(token.gerarToken).toHaveBeenCalledWith({ sub: "1", email: "x@x.com", role: Role.ATENDENTE });
	});
});
