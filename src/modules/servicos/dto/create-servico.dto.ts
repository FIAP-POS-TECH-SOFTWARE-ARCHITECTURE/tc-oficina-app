import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateServicoDto {
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
	preco!: number;

	@Type(() => Number)
	@IsInt()
	@Min(1)
	tempoEstimadoMin!: number;
}
