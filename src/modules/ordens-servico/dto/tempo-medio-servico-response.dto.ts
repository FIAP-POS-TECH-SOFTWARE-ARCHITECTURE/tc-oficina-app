import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TempoMedioServicoResponseDto {
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	servicoId!: string;

	@ApiProperty({ example: "Troca de Óleo" })
	nome!: string;

	@ApiProperty({ example: true })
	ativo!: boolean;

	@ApiPropertyOptional({ example: 45.5, nullable: true })
	tempoMedioMin!: number | null;

	@ApiProperty({ example: 10 })
	totalExecucoes!: number;
}
