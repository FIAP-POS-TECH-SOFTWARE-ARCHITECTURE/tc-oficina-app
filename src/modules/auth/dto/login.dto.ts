import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
	@IsNotEmpty({ message: "O email é obrigatório" })
	@IsEmail({}, { message: "Email inválido" })
	email!: string;

	@IsNotEmpty({ message: "A senha é obrigatória" })
	@IsString({ message: "A senha deve ser um texto" })
	@MinLength(1, { message: "A senha não pode estar vazia" })
	senha!: string;
}
