import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Role } from "../../../common/enums/role.enum";

export class CreateUsuarioDto {
	@IsString()
	@IsNotEmpty()
	nome!: string;

	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	senha!: string;

	@IsEnum(Role)
	role!: Role;
}
