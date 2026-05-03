import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum FiltroAtivoServico {
	ATIVOS = "ativos",
	INATIVOS = "inativos",
	AMBOS = "ambos",
}

export class MetricasTempoMedioDto {
	@ApiProperty({ enum: FiltroAtivoServico, required: false, default: FiltroAtivoServico.ATIVOS })
	@IsOptional()
	@IsEnum(FiltroAtivoServico)
	filtro?: FiltroAtivoServico;
}
