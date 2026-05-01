import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, Max } from "class-validator";

export class UpdateVeiculoDto {
	@IsOptional()
	@IsString()
	@MaxLength(60)
	marca?: string;

	@IsOptional()
	@IsString()
	@MaxLength(60)
	modelo?: string;

	@IsOptional()
	@IsInt()
	@Min(1900)
	@Max(2100)
	ano?: number;

	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
