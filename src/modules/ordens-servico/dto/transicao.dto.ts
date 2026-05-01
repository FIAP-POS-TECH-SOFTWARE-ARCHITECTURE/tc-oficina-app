import { IsOptional, IsString, MaxLength } from "class-validator";
import { IsCpfOrCnpj } from "../../../common/validators/cpf-cnpj.validator";

export class CancelarOsDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	motivo?: string;
}

export class AprovacaoPublicaDto {
	@IsCpfOrCnpj()
	documento!: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	observacao?: string;
}
