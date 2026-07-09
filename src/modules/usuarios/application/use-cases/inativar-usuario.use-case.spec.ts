import { Role } from "../../../../common/enums/role.enum";
import { InativarUsuarioUseCase } from "./inativar-usuario.use-case";

const gateway = { buscarPorId: jest.fn(), inativar: jest.fn() };

describe("InativarUsuarioUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 se não existe", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new InativarUsuarioUseCase(gateway as any).execute("1")).status).toBe(404);
	});

	it("422 quando já inativo", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: false });
		expect((await new InativarUsuarioUseCase(gateway as any).execute("1")).status).toBe(422);
	});

	it("200 inativa", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({ id: "1", ativo: true });
		gateway.inativar.mockResolvedValueOnce({
			id: "1",
			nome: "X",
			email: "a@a",
			role: Role.ATENDENTE,
			ativo: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		expect((await new InativarUsuarioUseCase(gateway as any).execute("1")).status).toBe(200);
	});
});
