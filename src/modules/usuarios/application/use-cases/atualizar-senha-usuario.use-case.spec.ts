import { Role } from "../../../../common/enums/role.enum";
import { AtualizarSenhaUsuarioUseCase } from "./atualizar-senha-usuario.use-case";

const gateway = { buscarPorId: jest.fn(), atualizar: jest.fn() };
const hasher = { hash: jest.fn(), verificar: jest.fn() };

const usuarioDb = {
	id: "1",
	nome: "X",
	email: "a@a",
	role: Role.ATENDENTE,
	ativo: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("AtualizarSenhaUsuarioUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new AtualizarSenhaUsuarioUseCase(gateway as any, hasher as any);

	it("403 quando ator é outro usuário não-admin", async () => {
		const r = await useCase().execute("1", { senha: "12345678" }, { id: "2", role: Role.ATENDENTE });
		expect(r.status).toBe(403);
	});

	it("404 quando usuário não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		const r = await useCase().execute("1", { senha: "12345678" }, { id: "1", role: Role.ATENDENTE });
		expect(r.status).toBe(404);
	});

	it("422 quando usuário está inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: false });
		const r = await useCase().execute("1", { senha: "12345678" }, { id: "1", role: Role.ATENDENTE });
		expect(r.status).toBe(422);
	});

	it("200 atualiza senha do próprio usuário com hash do port", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: true, role: Role.ATENDENTE });
		hasher.hash.mockResolvedValueOnce("novo-hash");
		gateway.atualizar.mockResolvedValueOnce(usuarioDb);
		const r = await useCase().execute("1", { senha: "12345678" }, { id: "1", role: Role.ATENDENTE });
		expect(r.status).toBe(200);
		expect(gateway.atualizar).toHaveBeenCalledWith("1", { senhaHash: "novo-hash" });
	});

	it("admin troca senha de qualquer um", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: true, role: Role.ATENDENTE });
		hasher.hash.mockResolvedValueOnce("novo-hash");
		gateway.atualizar.mockResolvedValueOnce(usuarioDb);
		const r = await useCase().execute("1", { senha: "12345678" }, { id: "99", role: Role.ADMINISTRADOR });
		expect(r.status).toBe(200);
	});
});
