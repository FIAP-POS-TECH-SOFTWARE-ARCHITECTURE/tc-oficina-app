import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class RegistrarRespostaFornecedorDto {
	@IsBoolean()
	aprovado!: boolean;

	@IsOptional()
	@IsString()
	@MaxLength(80)
	codigo?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	mensagem?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	motivoRecusa?: string;

	@IsOptional()
	@IsObject()
	payload?: Record<string, unknown>;
}
