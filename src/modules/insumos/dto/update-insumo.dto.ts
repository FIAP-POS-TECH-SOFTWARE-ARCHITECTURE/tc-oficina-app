import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class UpdateInsumoDto {
	@ApiProperty({ example: "Óleo de Motor 5W30", required: false })
	@IsOptional()
	@IsString({ message: "O nome deve ser um texto" })
	@MaxLength(120, { message: "O nome deve ter no máximo 120 caracteres" })
	nome?: string;

	@ApiProperty({ example: "Sintético, 1 litro", required: false })
	@IsOptional()
	@IsString({ message: "A descrição deve ser um texto" })
	@MaxLength(500, { message: "A descrição deve ter no máximo 500 caracteres" })
	descricao?: string;

	@ApiProperty({ example: 49.9, required: false })
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 }, { message: "O preço unitário deve ser um número com no máximo 2 casas decimais" })
	@IsPositive({ message: "O preço unitário deve ser maior que zero" })
	precoUnitario?: number;

	@ApiProperty({ example: 15, required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: "O estoque mínimo deve ser um número inteiro" })
	@Min(0, { message: "O estoque mínimo não pode ser negativo" })
	estoqueMinimo?: number;

	@ApiProperty({ example: true, required: false })
	@IsOptional()
	@IsBoolean({ message: "O campo ativo deve ser verdadeiro ou falso" })
	ativo?: boolean;
}