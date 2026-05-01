import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { Role } from "../../../common/enums/role.enum";

export class UpdateUsuarioDto {
	@IsOptional()
	@IsString()
	nome?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsEnum(Role)
	role?: Role;

	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
