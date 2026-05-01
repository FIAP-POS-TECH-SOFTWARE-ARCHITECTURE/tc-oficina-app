import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class EntradaInsumoDto {
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidade!: number;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	motivo?: string;
}

export class AjusteInsumoDto {
	@Type(() => Number)
	@IsInt()
	novaQuantidade!: number;

	@IsString()
	@MaxLength(255)
	motivo!: string;
}
