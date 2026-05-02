import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class EntradaInsumoDto {
	@ApiProperty({ example: 5 })
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidade!: number;

	@ApiProperty({ example: "Compra mensal", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	motivo?: string;
}

export class AjusteInsumoDto {
	@ApiProperty({ example: 10, description: "Nova quantidade em estoque" })
	@Type(() => Number)
	@IsInt()
	novaQuantidade!: number;

	@ApiProperty({ example: "Correção de inventário" })
	@IsString()
	@MaxLength(255)
	motivo!: string;
}
