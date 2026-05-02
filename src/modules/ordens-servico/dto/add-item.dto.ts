import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsUUID } from "class-validator";

export class AddItemServicoDto {
	@ApiProperty({ example: "uuid-do-servico" })
	@IsUUID()
	servicoId!: string;

	@ApiProperty({ example: 1, required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidade?: number;
}

export class AddItemInsumoDto {
	@ApiProperty({ example: "uuid-do-insumo" })
	@IsUUID()
	insumoId!: string;

	@ApiProperty({ example: 2 })
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidade!: number;
}
