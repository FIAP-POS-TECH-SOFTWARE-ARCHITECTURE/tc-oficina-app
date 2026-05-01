import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsUUID } from "class-validator";

export class CreateRegistroCompraDto {
	@IsUUID()
	insumoId!: string;

	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidadeSolicitada!: number;

	@IsOptional()
	@IsUUID()
	ordemServicoId?: string;
}
