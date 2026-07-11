import { Role } from "../../../../common/enums/role.enum";
import { AtualizarUsuarioUseCase } from "./atualizar-usuario.use-case";

const gateway = { buscarPorId: jest.fn(), buscarPorEmail: jest.fn(), atualizar: jest.fn() };

const usuarioDb = {
	id: "1",
	nome: "X",
	email: "a@a",
	role: Role.ATENDENTE,
	ativo: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("AtualizarUsuarioUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new AtualizarUsuarioUseCase(gateway as any);

	it("404 quando usuário não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await useCase().execute("1", { nome: "Novo" })).status).toBe(404);
	});

	it("422 quando usuário está inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: false });
		expect((await useCase().execute("1", { nome: "X" })).status).toBe(422);
	});

	it("409 quando troca de email já existente", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: true });
		gateway.buscarPorEmail.mockResolvedValueOnce({ id: "2" });
		expect((await useCase().execute("1", { email: "b@b" })).status).toBe(409);
	});

	it("200 quando troca email para endereço sem conflito", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: true });
		gateway.buscarPorEmail.mockResolvedValueOnce(null);
		gateway.atualizar.mockResolvedValueOnce({ ...usuarioDb, email: "novo@a.com" });
		expect((await useCase().execute("1", { email: "novo@a.com" })).status).toBe(200);
	});

	it("200 quando atualiza sem trocar email", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", email: "a@a", ativo: true });
		gateway.atualizar.mockResolvedValueOnce(usuarioDb);
		expect((await useCase().execute("1", { nome: "X" })).status).toBe(200);
		expect(gateway.buscarPorEmail).not.toHaveBeenCalled();
	});
});
