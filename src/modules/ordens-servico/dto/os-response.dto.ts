import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OsStatus, OsItemServicoStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { ClienteResponseDto } from "src/modules/clientes/dto/cliente-response.dto";
import { VeiculoResponseDto } from "src/modules/veiculos/dto/veiculo-response.dto";

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
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	id: string;

	@ApiProperty({ example: "OS-2024-001" })
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

	@ApiPropertyOptional({ type: ClienteResponseDto })
	cliente?: ClienteResponseDto;

	@ApiPropertyOptional({ type: VeiculoResponseDto })
	veiculo?: VeiculoResponseDto;

	@ApiPropertyOptional({ type: [OsItemServicoResponseDto] })
	itensServico?: OsItemServicoResponseDto[];

	@ApiPropertyOptional({ type: [OsItemInsumoResponseDto] })
	itensInsumo?: OsItemInsumoResponseDto[];
}

export class OsConsultaPublicaVeiculoDto {
	@ApiProperty({ example: "ABC1234" })
	placa!: string;

	@ApiProperty({ example: "Fiat" })
	marca!: string;

	@ApiProperty({ example: "Uno" })
	modelo!: string;
}

export class OsConsultaPublicaItemServicoDto {
	@ApiProperty({ example: "Troca de óleo" })
	nome!: string;

	@ApiProperty({ enum: OsItemServicoStatus })
	status!: OsItemServicoStatus;

	@ApiPropertyOptional()
	iniciadoExecucaoEm?: Date;

	@ApiPropertyOptional()
	finalizadoExecucaoEm?: Date;

	@ApiProperty()
	quantidade!: number;

	@ApiProperty({ type: Number })
	precoUnitario!: Decimal;

	@ApiProperty({ type: Number })
	subtotal!: Decimal;
}

export class OsConsultaPublicaItemInsumoDto {
	@ApiProperty({ example: "Óleo 5W30" })
	nome!: string;

	@ApiProperty()
	quantidade!: number;

	@ApiProperty({ type: Number })
	precoUnitario!: Decimal;

	@ApiProperty({ type: Number })
	subtotal!: Decimal;
}

export class OsConsultaPublicaHistoricoDto {
	@ApiPropertyOptional({ enum: OsStatus, nullable: true })
	statusAnterior!: OsStatus | null;

	@ApiProperty({ enum: OsStatus })
	statusNovo!: OsStatus;

	@ApiPropertyOptional({ nullable: true, type: String })
	observacao!: string | null;

	@ApiProperty()
	em!: Date;
}

export class OsConsultaPublicaResponseDto {
	@ApiProperty({ example: "OS-2026-000001" })
	numero!: string;

	@ApiProperty({ example: "João S****", description: "Nome do cliente mascarado" })
	cliente!: string;

	@ApiProperty({ type: OsConsultaPublicaVeiculoDto })
	veiculo!: OsConsultaPublicaVeiculoDto;

	@ApiProperty({ enum: OsStatus })
	status!: OsStatus;

	@ApiPropertyOptional({ nullable: true, type: String })
	diagnostico!: string | null;

	@ApiProperty({ type: Number })
	valorTotal!: Decimal;

	@ApiProperty({ type: [OsConsultaPublicaItemServicoDto] })
	itensServico!: OsConsultaPublicaItemServicoDto[];

	@ApiProperty({ type: [OsConsultaPublicaItemInsumoDto] })
	itensInsumo!: OsConsultaPublicaItemInsumoDto[];

	@ApiProperty({ type: [OsConsultaPublicaHistoricoDto] })
	historico!: OsConsultaPublicaHistoricoDto[];
}
