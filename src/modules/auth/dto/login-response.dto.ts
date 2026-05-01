import { UsuarioResponseDto } from "../../usuarios/dto/usuario-response.dto";

export interface LoginResponseDto {
	accessToken: string;
	user: UsuarioResponseDto;
}
