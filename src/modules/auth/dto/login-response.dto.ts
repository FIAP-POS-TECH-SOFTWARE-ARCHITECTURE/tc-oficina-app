import { ApiProperty } from "@nestjs/swagger";
import { UsuarioResponseDto } from "../../usuarios/dto/usuario-response.dto";

export class LoginResponseDto {
	@ApiProperty({ description: "Token de acesso JWT" })
	accessToken!: string;

	@ApiProperty({ type: () => UsuarioResponseDto, description: "Dados do usuário autenticado" })
	user!: UsuarioResponseDto;
}
