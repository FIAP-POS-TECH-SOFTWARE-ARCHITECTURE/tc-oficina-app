import { DomainError } from "../../../common/domain/domain-error";
import { RoleUsuario } from "./role-usuario";
import { Usuario } from "./usuario.entity";

describe("Usuario (entidade)", () => {
	const params = { nome: "Admin", email: "admin@oficina.com", senhaHash: "hash", role: "ADMINISTRADOR" };

	it("cria usuário ativo com dados válidos", () => {
		const usuario = Usuario.criar(params);
		expect(usuario.id).toBeNull();
		expect(usuario.nome).toBe("Admin");
		expect(usuario.email).toBe("admin@oficina.com");
		expect(usuario.role).toBe(RoleUsuario.ADMINISTRADOR);
		expect(usuario.ativo).toBe(true);
	});

	it("lança DomainError sem nome", () => {
		expect(() => Usuario.criar({ ...params, nome: " " })).toThrow(DomainError);
		expect(() => Usuario.criar({ ...params, nome: "" })).toThrow("Usuário precisa de nome");
	});

	it("lança DomainError sem e-mail", () => {
		expect(() => Usuario.criar({ ...params, email: "" })).toThrow("Usuário precisa de e-mail");
	});

	it("lança DomainError com e-mail em formato inválido", () => {
		expect(() => Usuario.criar({ ...params, email: "sem-arroba" })).toThrow("E-mail inválido");
	});

	it("lança DomainError com role inválida", () => {
		expect(() => Usuario.criar({ ...params, role: "SUPREMO" })).toThrow("Role inválida");
	});

	it("lança DomainError sem senhaHash", () => {
		expect(() => Usuario.criar({ ...params, senhaHash: "" })).toThrow("Usuário precisa de senha");
	});
});
