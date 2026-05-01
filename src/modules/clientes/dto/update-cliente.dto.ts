import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateClienteDto {
	@IsOptional()
	@IsString({ message: "O nome deve ser um texto" })
	@MaxLength(120, { message: "O nome deve ter no máximo 120 caracteres" })
	nome?: string;

	@IsOptional()
	@IsEmail({}, { message: "O email deve ser válido" })
	@MaxLength(255, { message: "O email deve ter no máximo 255 caracteres" })
	email?: string;

	@IsOptional()
	@IsString({ message: "O telefone deve ser um texto" })
	@MaxLength(20, { message: "O telefone deve ter no máximo 20 caracteres" })
	telefone?: string;

	@IsOptional()
	@IsString({ message: "O endereço deve ser um texto" })
	@MaxLength(255, { message: "O endereço deve ter no máximo 255 caracteres" })
	endereco?: string;

	@IsOptional()
	@IsBoolean({ message: "O campo ativo deve ser verdadeiro ou falso" })
	ativo?: boolean;
}