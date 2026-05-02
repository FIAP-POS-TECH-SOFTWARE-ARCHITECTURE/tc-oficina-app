import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { Role } from "../../../common/enums/role.enum";

export class UpdateUsuarioDto {
	@ApiProperty({ example: "Admin Atualizado", required: false })
	@IsOptional()
	@IsString()
	nome?: string;

	@ApiProperty({ example: "novo_email@oficina.com", required: false })
	@IsOptional()
	@IsEmail()
	email?: string;

	@ApiProperty({ enum: Role, required: false })
	@IsOptional()
	@IsEnum(Role)
	role?: Role;

	@ApiProperty({ example: true, required: false })
	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
