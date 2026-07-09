import { Role } from "../../../../common/enums/role.enum";
import { CriarUsuarioUseCase } from "./criar-usuario.use-case";

const gateway = { buscarPorEmail: jest.fn(), criar: jest.fn() };
const hasher = { hash: jest.fn(), verificar: jest.fn() };

const usuarioDb = {
	id: "1",
	nome: "X",
	email: "a@a.com",
	senhaHash: "hash",
	role: Role.ATENDENTE,
	ativo: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("CriarUsuarioUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new CriarUsuarioUseCase(gateway as any, hasher);

	it("409 quando e-mail já existe", async () => {
		gateway.buscarPorEmail.mockResolvedValueOnce({ id: "x" });
		const r = await useCase().execute({ nome: "X", email: "a@a.com", senha: "12345678", role: Role.ATENDENTE });
		expect(r.status).toBe(409);
	});

	it("201 quando cria com senha hasheada pelo port", async () => {
		gateway.buscarPorEmail.mockResolvedValueOnce(null);
		hasher.hash.mockResolvedValueOnce("hash-argon");
		gateway.criar.mockResolvedValueOnce(usuarioDb);
		const r = await useCase().execute({ nome: "X", email: "a@a.com", senha: "12345678", role: Role.ATENDENTE });
		expect(r.status).toBe(201);
		expect(hasher.hash).toHaveBeenCalledWith("12345678");
		expect(gateway.criar).toHaveBeenCalledWith(
			expect.objectContaining({ email: "a@a.com", senhaHash: "hash-argon", role: Role.ATENDENTE }),
		);
	});
});
