import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
	@ApiProperty({ example: "usuario@oficina.com" })
	@IsNotEmpty({ message: "O email é obrigatório" })
	@IsEmail({}, { message: "Email inválido" })
	email!: string;

	@ApiProperty({ example: "123456" })
	@IsNotEmpty({ message: "A senha é obrigatória" })
	@IsString({ message: "A senha deve ser um texto" })
	@MinLength(1, { message: "A senha não pode estar vazia" })
	senha!: string;
}
