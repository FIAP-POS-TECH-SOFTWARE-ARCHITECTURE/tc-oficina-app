import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateClienteDto {
	@ApiProperty({ example: "João Silva", required: false })
	@IsOptional()
	@IsString({ message: "O nome deve ser um texto" })
	@MaxLength(120, { message: "O nome deve ter no máximo 120 caracteres" })
	nome?: string;

	@ApiProperty({ example: "joao@email.com", required: false })
	@IsOptional()
	@IsEmail({}, { message: "O email deve ser válido" })
	@MaxLength(255, { message: "O email deve ter no máximo 255 caracteres" })
	email?: string;

	@ApiProperty({ example: "(11) 98888-7777", required: false })
	@IsOptional()
	@IsString({ message: "O telefone deve ser um texto" })
	@MaxLength(20, { message: "O telefone deve ter no máximo 20 caracteres" })
	telefone?: string;

	@ApiProperty({ example: "Rua das Flores, 123", required: false })
	@IsOptional()
	@IsString({ message: "O endereço deve ser um texto" })
	@MaxLength(255, { message: "O endereço deve ter no máximo 255 caracteres" })
	endereco?: string;

	@ApiProperty({ example: true, required: false })
	@IsOptional()
	@IsBoolean({ message: "O campo ativo deve ser verdadeiro ou falso" })
	ativo?: boolean;
}
