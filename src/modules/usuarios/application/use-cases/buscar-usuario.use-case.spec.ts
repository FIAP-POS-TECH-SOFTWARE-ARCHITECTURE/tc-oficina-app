import { Role } from "../../../../common/enums/role.enum";
import { BuscarUsuarioUseCase } from "./buscar-usuario.use-case";

const gateway = { buscarPorId: jest.fn() };

describe("BuscarUsuarioUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("404 quando não encontra", async () => {
		gateway.buscarPorId.mockResolvedValueOnce(null);
		expect((await new BuscarUsuarioUseCase(gateway as any).execute("nope")).status).toBe(404);
	});

	it("200 quando encontra", async () => {
		gateway.buscarPorId.mockResolvedValueOnce({
			id: "1",
			nome: "X",
			email: "a@a",
			role: Role.ATENDENTE,
			ativo: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		expect((await new BuscarUsuarioUseCase(gateway as any).execute("1")).status).toBe(200);
	});
});
