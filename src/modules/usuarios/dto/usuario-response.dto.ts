import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../../common/enums/role.enum";

export class UsuarioResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	nome!: string;

	@ApiProperty()
	email!: string;

	@ApiProperty({ enum: Role })
	role!: Role;

	@ApiProperty()
	ativo!: boolean;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
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
