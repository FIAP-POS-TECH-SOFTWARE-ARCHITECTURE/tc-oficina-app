import { Role } from "../../../../common/enums/role.enum";

export const USUARIOS_GATEWAY = Symbol("USUARIOS_GATEWAY");

export interface UsuarioRegistro {
	id: string;
	nome: string;
	email: string;
	senhaHash: string;
	role: Role;
	ativo: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface UsuariosGatewayPort {
	criar(dados: { nome: string; email: string; senhaHash: string; role: Role }): Promise<UsuarioRegistro>;
	listarTodos(): Promise<UsuarioRegistro[]>;
	buscarPorId(id: string): Promise<UsuarioRegistro | null>;
	buscarPorEmail(email: string): Promise<UsuarioRegistro | null>;
	atualizar(
		id: string,
		dados: Partial<{ nome: string; email: string; role: Role; ativo: boolean; senhaHash: string }>,
	): Promise<UsuarioRegistro>;
	inativar(id: string): Promise<UsuarioRegistro>;
	contarAdminsAtivos(): Promise<number>;
}
