import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, Max } from "class-validator";

export class UpdateVeiculoDto {
	@ApiProperty({ example: "Toyota", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(60)
	marca?: string;

	@ApiProperty({ example: "Corolla", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(60)
	modelo?: string;

	@ApiProperty({ example: 2025, required: false })
	@IsOptional()
	@IsInt()
	@Min(1900)
	@Max(2100)
	ano?: number;

	@ApiProperty({ example: true, required: false })
	@IsOptional()
	@IsBoolean()
	ativo?: boolean;
}
