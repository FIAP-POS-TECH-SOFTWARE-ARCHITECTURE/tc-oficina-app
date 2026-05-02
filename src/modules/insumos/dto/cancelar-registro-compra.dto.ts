import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CancelarRegistroCompraDto {
	@ApiProperty({ example: "Encontramos um preço melhor" })
	@IsString()
	@MaxLength(255)
	motivo!: string;
}
