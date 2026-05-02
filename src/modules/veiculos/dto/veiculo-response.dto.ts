import { ApiProperty } from "@nestjs/swagger";

export class VeiculoResponseDto {
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	id: string;

	@ApiProperty({ example: "ABC1234" })
	placa: string;

	@ApiProperty({ example: "Toyota" })
	marca: string;

	@ApiProperty({ example: "Corolla" })
	modelo: string;

	@ApiProperty({ example: 2022 })
	ano: number;

	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	clienteId: string;

	@ApiProperty({ example: true })
	ativo: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
