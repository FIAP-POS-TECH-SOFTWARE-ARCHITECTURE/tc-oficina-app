import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class ReceberCompraDto {
	@ApiProperty({ example: "NF-2026-001" })
	@IsString()
	@MaxLength(80)
	notaFiscalNumero!: string;

	@ApiProperty({ example: "35230912345678000190550010000012341234567890", required: false })
	@IsOptional()
	@IsString()
	@MaxLength(80)
	notaFiscalChave?: string;

	@ApiProperty({ example: "nota_fiscal.pdf" })
	@IsString()
	@MaxLength(255)
	arquivoNome!: string;

	@ApiProperty({ example: "application/pdf" })
	@IsString()
	@MaxLength(120)
	arquivoTipo!: string;

	@ApiProperty({ example: 1024000, description: "Tamanho em bytes" })
	@Type(() => Number)
	@IsInt()
	@IsPositive()
	arquivoTamanho!: number;

	@ApiProperty({ example: "https://storage.oficina.com/nfs/nf-001.pdf" })
	@IsString()
	@MaxLength(500)
	arquivoUrl!: string;
}
