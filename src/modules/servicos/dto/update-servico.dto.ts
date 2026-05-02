import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class UpdateServicoDto {
	@ApiPropertyOptional({ example: "Troca de Óleo" })
	@IsOptional()
	@IsString()
	@MaxLength(120)
	nome?: string;

	@ApiPropertyOptional({ example: "Troca de óleo sintético 5W30" })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	descricao?: string;

	@ApiPropertyOptional({ example: 150.0 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@IsPositive()
	preco?: number;

	@ApiPropertyOptional({ example: 60 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	tempoEstimadoMin?: number;

	@ApiPropertyOptional({ example: true })
	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
