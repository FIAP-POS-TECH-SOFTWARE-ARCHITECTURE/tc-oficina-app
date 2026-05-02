import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsUUID } from "class-validator";

export class CreateRegistroCompraDto {
	@ApiProperty({ example: "uuid-do-insumo" })
	@IsUUID()
	insumoId!: string;

	@ApiProperty({ example: 10 })
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidadeSolicitada!: number;

	@ApiProperty({ example: "uuid-da-os", required: false })
	@IsOptional()
	@IsUUID()
	ordemServicoId?: string;
}
