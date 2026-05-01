import { IsUUID } from "class-validator";

export class CreateOsDto {
	@IsUUID()
	clienteId!: string;

	@IsUUID()
	veiculoId!: string;
}
