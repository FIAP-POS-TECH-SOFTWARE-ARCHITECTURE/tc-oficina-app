import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateServicoDto {
	@ApiProperty({ example: "Troca de Óleo", description: "Nome do serviço" })
	@IsString()
	@MaxLength(120)
	nome!: string;

	@ApiPropertyOptional({ example: "Troca de óleo sintético 5W30", description: "Descrição detalhada do serviço" })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	descricao?: string;

	@ApiProperty({ example: 150.0, description: "Preço do serviço" })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@IsPositive()
	preco!: number;

	@ApiProperty({ example: 60, description: "Tempo estimado em minutos" })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	tempoEstimadoMin!: number;
}
