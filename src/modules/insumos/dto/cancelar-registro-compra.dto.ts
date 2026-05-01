import { IsString, MaxLength } from "class-validator";

export class CancelarRegistroCompraDto {
	@IsString()
	@MaxLength(255)
	motivo!: string;
}
