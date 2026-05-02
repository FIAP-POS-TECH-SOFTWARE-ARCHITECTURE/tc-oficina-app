import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, MaxLength, Min, Max } from "class-validator";
import { IsPlacaVeiculo } from "../../../common/validators/placa.validator";

export class CreateVeiculoDto {
	@ApiProperty({ example: "ABC-1234" })
	@IsPlacaVeiculo()
	placa!: string;

	@ApiProperty({ example: "Toyota" })
	@IsString()
	@MaxLength(60)
	marca!: string;

	@ApiProperty({ example: "Corolla" })
	@IsString()
	@MaxLength(60)
	modelo!: string;

	@ApiProperty({ example: 2024 })
	@IsInt()
	@Min(1900)
	@Max(2100)
	ano!: number;
}
