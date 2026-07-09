import { DomainError } from "../../../common/domain/domain-error";
import { RoleUsuario } from "./role-usuario";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

export class Usuario {
	private constructor(
		readonly id: string | null,
		readonly nome: string,
		readonly email: string,
		readonly senhaHash: string,
		readonly role: RoleUsuario,
		readonly ativo: boolean,
	) {}

	static criar(params: { nome: string; email: string; senhaHash: string; role: string }): Usuario {
		if (!params.nome?.trim()) throw new DomainError("Usuário precisa de nome");
		if (!params.email?.trim()) throw new DomainError("Usuário precisa de e-mail");
		if (!EMAIL_REGEX.test(params.email)) throw new DomainError("E-mail inválido");
		if (!Object.values(RoleUsuario).includes(params.role as RoleUsuario)) throw new DomainError("Role inválida");
		if (!params.senhaHash?.trim()) throw new DomainError("Usuário precisa de senha");
		return new Usuario(null, params.nome, params.email, params.senhaHash, params.role as RoleUsuario, true);
	}
}
