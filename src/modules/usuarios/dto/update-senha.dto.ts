import { IsString, MinLength } from "class-validator";

export class UpdateSenhaDto {
	@IsString()
	@MinLength(8)
	senha!: string;
}
