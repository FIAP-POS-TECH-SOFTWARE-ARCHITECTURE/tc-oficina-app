import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Decimal } from "@prisma/client/runtime/library";

export class ServicoResponseDto {
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	id: string;

	@ApiProperty({ example: "Troca de Óleo" })
	nome: string;

	@ApiPropertyOptional({ example: "Troca de óleo do motor e filtro" })
	descricao?: string;

	@ApiProperty({ example: 150.0, type: Number })
	preco: Decimal;

	@ApiProperty({ example: 60 })
	tempoEstimadoMin: number;

	@ApiProperty({ example: true })
	ativo: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
