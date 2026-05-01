import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class UpdateInsumoDto {
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
	precoUnitario?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	estoqueMinimo?: number;

	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
