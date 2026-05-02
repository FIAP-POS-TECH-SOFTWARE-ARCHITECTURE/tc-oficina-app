import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RegistroCompraStatus } from "@prisma/client";
import { OsResponseDto } from "../../ordens-servico/dto/os-response.dto";
import { UsuarioResponseDto } from "../../usuarios/dto/usuario-response.dto";
import { InsumoResponseDto } from "./insumo-response.dto";

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

	@ApiPropertyOptional()
	aprovadoEm?: Date;

	@ApiPropertyOptional()
	recusadoEm?: Date;

	@ApiPropertyOptional()
	canceladoEm?: Date;

	@ApiPropertyOptional()
	recebidoEm?: Date;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiPropertyOptional({ type: InsumoResponseDto })
	insumo?: InsumoResponseDto;

	@ApiPropertyOptional({ type: OsResponseDto })
	ordemServico?: OsResponseDto;

	@ApiPropertyOptional({ type: UsuarioResponseDto })
	solicitadoPor?: UsuarioResponseDto;

	@ApiPropertyOptional({ type: UsuarioResponseDto })
	recebidoPor?: UsuarioResponseDto;
}
