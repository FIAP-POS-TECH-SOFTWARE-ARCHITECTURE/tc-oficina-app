import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateInsumoDto {
	@ApiProperty({ example: "OLEO-5W30", description: "Código único do insumo" })
	@IsNotEmpty({ message: "O código é obrigatório" })
	@IsString({ message: "O código deve ser um texto" })
	@MaxLength(60, { message: "O código deve ter no máximo 60 caracteres" })
	codigo!: string;

	@ApiProperty({ example: "Óleo de Motor 5W30", description: "Nome do insumo" })
	@IsNotEmpty({ message: "O nome é obrigatório" })
	@IsString({ message: "O nome deve ser um texto" })
	@MaxLength(120, { message: "O nome deve ter no máximo 120 caracteres" })
	nome!: string;

	@ApiProperty({ example: "Sintético, 1 litro", required: false })
	@IsOptional()
	@IsString({ message: "A descrição deve ser um texto" })
	@MaxLength(500, { message: "A descrição deve ter no máximo 500 caracteres" })
	descricao?: string;

	@ApiProperty({ example: 45.9, description: "Preço unitário do insumo" })
	@IsNotEmpty({ message: "O preço unitário é obrigatório" })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 }, { message: "O preço unitário deve ser um número com no máximo 2 casas decimais" })
	@IsPositive({ message: "O preço unitário deve ser maior que zero" })
	precoUnitario!: number;

	@ApiProperty({ example: 10, required: false, description: "Estoque mínimo para alerta" })
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: "O estoque mínimo deve ser um número inteiro" })
	@Min(0, { message: "O estoque mínimo não pode ser negativo" })
	estoqueMinimo?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: "A quantidade em estoque deve ser um número inteiro" })
	@Min(0, { message: "A quantidade em estoque não pode ser negativa" })
	quantidadeEstoque?: number;
}
