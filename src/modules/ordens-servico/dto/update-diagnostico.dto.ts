import { IsString, MaxLength } from "class-validator";

export class UpdateDiagnosticoDto {
	@IsString()
	@MaxLength(2000)
	diagnostico!: string;
}
