import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateOsDto {
	@ApiProperty({ example: "uuid-do-cliente" })
	@IsUUID()
	clienteId!: string;

	@ApiProperty({ example: "uuid-do-veiculo" })
	@IsUUID()
	veiculoId!: string;
}
