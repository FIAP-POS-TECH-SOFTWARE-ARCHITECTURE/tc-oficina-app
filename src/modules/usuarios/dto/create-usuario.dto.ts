import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Role } from "../../../common/enums/role.enum";

export class CreateUsuarioDto {
	@ApiProperty({ example: "Admin Oficina" })
	@IsString()
	@IsNotEmpty()
	nome!: string;

	@ApiProperty({ example: "admin@oficina.com" })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: "12345678", minLength: 8 })
	@IsString()
	@MinLength(8)
	senha!: string;

	@ApiProperty({ enum: Role })
	@IsEnum(Role)
	role!: Role;
}
