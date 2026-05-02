import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistroCompraStatus } from '@prisma/client';

export class RegistroCompraResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  insumoId: string;

  @ApiPropertyOptional()
  ordemServicoId?: string;

  @ApiProperty()
  quantidadeSolicitada: number;

  @ApiProperty({ enum: RegistroCompraStatus })
  status: RegistroCompraStatus;

  @ApiPropertyOptional()
  fornecedorRespostaCodigo?: string;

  @ApiPropertyOptional()
  fornecedorMensagem?: string;

  @ApiPropertyOptional()
  motivoRecusa?: string;

  @ApiPropertyOptional()
  motivoCancelamento?: string;

  @ApiPropertyOptional()
  solicitadoPorId?: string;

  @ApiPropertyOptional()
  recebidoPorId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
