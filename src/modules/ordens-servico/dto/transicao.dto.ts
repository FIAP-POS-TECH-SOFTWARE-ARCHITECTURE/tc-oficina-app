import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { IsCpfOrCnpj } from "../../../common/validators/cpf-cnpj.validator";

export class CancelarOsDto {
	@ApiProperty({ example: "Cliente desistiu", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	motivo?: string;
}

export class AprovacaoPublicaDto {
	@ApiProperty({ example: "123.456.789-00", description: "Documento do cliente para validar aprovação" })
	@IsCpfOrCnpj()
	documento!: string;

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
