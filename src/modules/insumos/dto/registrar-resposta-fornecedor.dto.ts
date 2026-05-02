import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class RegistrarRespostaFornecedorDto {
	@ApiProperty({ example: true })
	@IsNotEmpty({ message: "O campo 'aprovado' é obrigatório." })
	@IsBoolean({ message: "O campo 'aprovado' deve ser verdadeiro ou falso." })
	aprovado!: boolean;

	@ApiProperty({ example: "CONF-123", required: false })
	@IsOptional()
	@IsString({ message: "O campo 'codigo' deve ser um texto." })
	@MaxLength(80, { message: "O campo 'codigo' deve ter no máximo 80 caracteres." })
	codigo?: string;

	@ApiProperty({ example: "Pedido aceito e em processamento", required: false })
	@IsOptional()
	@IsString({ message: "O campo 'mensagem' deve ser um texto." })
	@MaxLength(255, { message: "O campo 'mensagem' deve ter no máximo 255 caracteres." })
	mensagem?: string;

	@ApiProperty({ example: "Fora de estoque", required: false })
	@IsOptional()
	@IsString({ message: "O campo 'motivoRecusa' deve ser um texto." })
	@MaxLength(255, { message: "O campo 'motivoRecusa' deve ter no máximo 255 caracteres." })
	motivoRecusa?: string;

	@ApiProperty({ example: { orderId: 456 }, required: false })
	@IsOptional()
	@IsObject({ message: "O campo 'payload' deve ser um objeto válido." })
	payload?: Record<string, unknown>;
}
