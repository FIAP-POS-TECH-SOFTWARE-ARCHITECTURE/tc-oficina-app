import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class ReceberCompraDto {
	@IsString()
	@MaxLength(80)
	notaFiscalNumero!: string;

	@IsOptional()
	@IsString()
	@MaxLength(80)
	notaFiscalChave?: string;

	@IsString()
	@MaxLength(255)
	arquivoNome!: string;

	@IsString()
	@MaxLength(120)
	arquivoTipo!: string;

	@Type(() => Number)
	@IsInt()
	@IsPositive()
	arquivoTamanho!: number;

	@IsString()
	@MaxLength(500)
	arquivoUrl!: string;
}
