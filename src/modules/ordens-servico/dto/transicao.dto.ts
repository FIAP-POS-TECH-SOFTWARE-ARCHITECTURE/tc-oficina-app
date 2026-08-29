import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CancelarOsDto {
	@ApiProperty({ example: "Cliente desistiu", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	motivo?: string;
}

export class AprovacaoPublicaDto {
	@ApiProperty({ example: "Pode iniciar o serviço", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	observacao?: string;
}

export class DesbloquearOsDto {
	@ApiProperty({ example: "Insumos chegaram", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	observacao?: string;
}
