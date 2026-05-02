import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoDocumentoCliente } from "@prisma/client";

export class ClienteResponseDto {
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	id: string;

	@ApiProperty({ example: "João Silva" })
	nome: string;

	@ApiProperty({ example: "12345678901" })
	documento: string;

	@ApiProperty({ enum: TipoDocumentoCliente, example: TipoDocumentoCliente.CPF })
	tipoDocumento: TipoDocumentoCliente;

	@ApiPropertyOptional({ example: "joao@email.com" })
	email?: string;

	@ApiPropertyOptional({ example: "11999999999" })
	telefone?: string;

	@ApiPropertyOptional({ example: "Rua das Flores, 123" })
	endereco?: string;

	@ApiProperty({ example: true })
	ativo: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
