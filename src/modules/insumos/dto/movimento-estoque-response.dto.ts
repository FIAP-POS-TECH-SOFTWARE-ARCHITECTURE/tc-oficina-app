import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoMovimentoEstoque } from "@prisma/client";

export class MovimentoEstoqueResponseDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	insumoId: string;

	@ApiProperty({ enum: TipoMovimentoEstoque })
	tipo: TipoMovimentoEstoque;

	@ApiProperty()
	quantidade: number;

	@ApiProperty()
	quantidadeAnterior: number;

	@ApiProperty()
	quantidadePosterior: number;

	@ApiPropertyOptional()
	ordemServicoId?: string;

	@ApiPropertyOptional()
	motivo?: string;

	@ApiPropertyOptional()
	usuarioId?: string;

	@ApiProperty()
	createdAt: Date;
}
