import { Role } from "../../../../common/enums/role.enum";
import { ListarUsuariosUseCase } from "./listar-usuarios.use-case";

const gateway = { listarTodos: jest.fn() };

describe("ListarUsuariosUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	it("200 retorna lista mapeada para o response dto", async () => {
		gateway.listarTodos.mockResolvedValueOnce([
			{ id: "1", nome: "X", email: "a@a", role: Role.ATENDENTE, ativo: true, createdAt: new Date(), updatedAt: new Date() },
		]);
		const r = await new ListarUsuariosUseCase(gateway as any).execute();
		expect(r.status).toBe(200);
		expect(r.data?.length).toBe(1);
		expect(r.data?.[0]).not.toHaveProperty("senhaHash");
	});
});
