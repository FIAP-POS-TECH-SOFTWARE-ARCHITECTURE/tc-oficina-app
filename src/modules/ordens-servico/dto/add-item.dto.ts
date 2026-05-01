import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsUUID } from "class-validator";

export class AddItemServicoDto {
	@IsUUID()
	servicoId!: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidade?: number;
}

export class AddItemInsumoDto {
	@IsUUID()
	insumoId!: string;

	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantidade!: number;
}
