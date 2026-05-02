import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class InsumoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'OLEO-5W30' })
  codigo: string;

  @ApiProperty({ example: 'Óleo 5W30' })
  nome: string;

  @ApiPropertyOptional({ example: 'Óleo sintético 5W30' })
  descricao?: string;

  @ApiProperty({ example: 45.0, type: Number })
  precoUnitario: Decimal;

  @ApiProperty({ example: 10 })
  quantidadeEstoque: number;

  @ApiProperty({ example: 5 })
  estoqueMinimo: number;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
