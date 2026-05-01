import { IsInt, IsString, MaxLength, Min, Max } from "class-validator";
import { IsPlacaVeiculo } from "../../../common/validators/placa.validator";

export class CreateVeiculoDto {
	@IsPlacaVeiculo()
	placa!: string;

	@IsString()
	@MaxLength(60)
	marca!: string;

	@IsString()
	@MaxLength(60)
	modelo!: string;

	@IsInt()
	@Min(1900)
	@Max(2100)
	ano!: number;
}
