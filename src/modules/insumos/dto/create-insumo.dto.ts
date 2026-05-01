import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateInsumoDto {
	@IsString()
	@MaxLength(60)
	codigo!: string;

	@IsString()
	@MaxLength(120)
	nome!: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	descricao?: string;

	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@IsPositive()
	precoUnitario!: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	estoqueMinimo?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	quantidadeEstoque?: number;
}
