import { Role } from "../../../common/enums/role.enum";

export class UsuarioResponseDto {
	id!: string;
	nome!: string;
	email!: string;
	role!: Role;
	ativo!: boolean;
	createdAt!: Date;
	updatedAt!: Date;

	static fromEntity(u: {
		id: string;
		nome: string;
		email: string;
		role: Role;
		ativo: boolean;
		createdAt: Date;
		updatedAt: Date;
	}): UsuarioResponseDto {
		const dto = new UsuarioResponseDto();
		dto.id = u.id;
		dto.nome = u.nome;
		dto.email = u.email;
		dto.role = u.role;
		dto.ativo = u.ativo;
		dto.createdAt = u.createdAt;
		dto.updatedAt = u.updatedAt;
		return dto;
	}
}
