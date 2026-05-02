import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OsStatus, OsItemServicoStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class OsItemServicoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ordemServicoId: string;

  @ApiProperty()
  servicoId: string;

  @ApiProperty({ enum: OsItemServicoStatus })
  status: OsItemServicoStatus;

  @ApiProperty({ type: Number })
  precoUnitario: Decimal;

  @ApiProperty()
  quantidade: number;

  @ApiProperty({ type: Number })
  subtotal: Decimal;

  @ApiPropertyOptional()
  iniciadoExecucaoEm?: Date;

  @ApiPropertyOptional()
  finalizadoExecucaoEm?: Date;
}

export class OsItemInsumoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ordemServicoId: string;

  @ApiProperty()
  insumoId: string;

  @ApiProperty({ type: Number })
  precoUnitario: Decimal;

  @ApiProperty()
  quantidade: number;

  @ApiProperty({ type: Number })
  subtotal: Decimal;
}

export class OsResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'OS-2024-001' })
  numero: string;

  @ApiProperty()
  clienteId: string;

  @ApiProperty()
  veiculoId: string;

  @ApiProperty({ enum: OsStatus })
  status: OsStatus;

  @ApiPropertyOptional()
  diagnostico?: string;

  @ApiProperty({ type: Number })
  valorTotal: Decimal;

  @ApiPropertyOptional()
  aprovadoEm?: Date;

  @ApiPropertyOptional()
  iniciadoExecucaoEm?: Date;

  @ApiPropertyOptional()
  finalizadoEm?: Date;

  @ApiPropertyOptional()
  entregueEm?: Date;

  @ApiPropertyOptional()
  canceladoEm?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [OsItemServicoResponseDto] })
  itensServico?: OsItemServicoResponseDto[];

  @ApiPropertyOptional({ type: [OsItemInsumoResponseDto] })
  itensInsumo?: OsItemInsumoResponseDto[];
}
