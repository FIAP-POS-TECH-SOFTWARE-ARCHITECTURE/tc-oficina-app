import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class UpdateDiagnosticoDto {
	@ApiProperty({ example: "Vazamento de óleo na junta do cabeçote..." })
	@IsString()
	@MaxLength(2000)
	diagnostico!: string;
}
