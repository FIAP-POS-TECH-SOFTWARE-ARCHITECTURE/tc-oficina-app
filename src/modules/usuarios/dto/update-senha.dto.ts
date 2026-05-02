import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdateSenhaDto {
	@ApiProperty({ example: "nova_senha_123", minLength: 8 })
	@IsString()
	@MinLength(8)
	senha!: string;
}
