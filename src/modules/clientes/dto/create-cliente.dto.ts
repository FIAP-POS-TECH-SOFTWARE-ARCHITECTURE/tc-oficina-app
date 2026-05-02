import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { IsCpfOrCnpj } from "../../../common/validators/cpf-cnpj.validator";

export class CreateClienteDto {
	@ApiProperty({ example: "João Silva", description: "Nome do cliente" })
	@IsNotEmpty({ message: "O nome é obrigatório" })
	@IsString({ message: "O nome deve ser um texto" })
	@MaxLength(120, { message: "O nome deve ter no máximo 120 caracteres" })
	nome!: string;

	@ApiProperty({ example: "123.456.789-00", description: "CPF ou CNPJ do cliente" })
	@IsNotEmpty({ message: "O documento é obrigatório" })
	@IsCpfOrCnpj({ message: "O documento deve ser um CPF ou CNPJ válido" })
	documento!: string;

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
}
