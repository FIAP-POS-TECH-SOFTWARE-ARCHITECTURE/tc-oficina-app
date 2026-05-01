import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class UpdateServicoDto {
	@IsOptional()
	@IsString()
	@MaxLength(120)
	nome?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	descricao?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@IsPositive()
	preco?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	tempoEstimadoMin?: number;

	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
