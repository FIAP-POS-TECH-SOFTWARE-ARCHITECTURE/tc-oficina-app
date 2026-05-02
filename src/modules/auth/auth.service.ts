import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SR } from "../../common/utils/service-response.util";
import { UsuarioResponseDto } from "../usuarios/dto/usuario-response.dto";
import { UsuariosRepository } from "../usuarios/usuarios.repository";
import { LoginDto } from "./dto/login.dto";
import { LoginResponseDto } from "./dto/login-response.dto";
import { IServiceResponse } from "semantic-response";
import * as argon2 from "argon2";

@Injectable()
export class AuthService {
	constructor(
		private readonly usuarios: UsuariosRepository,
		private readonly jwt: JwtService,
	) {}

	async login(dto: LoginDto): Promise<IServiceResponse<LoginResponseDto>> {
		const usuario = await this.usuarios.findByEmail(dto.email);
		if (!usuario?.ativo) return SR.unauthorized<LoginResponseDto>(undefined, "Credenciais inválidas");

		const ok = await argon2.verify(usuario.senhaHash, dto.senha);
		if (!ok) return SR.unauthorized<LoginResponseDto>(undefined, "Credenciais inválidas");

		const accessToken = await this.jwt.signAsync({
			sub: usuario.id,
			email: usuario.email,
			role: usuario.role,
		});

		return SR.ok<LoginResponseDto>(
			{
				accessToken,
				user: UsuarioResponseDto.fromEntity(usuario),
			},
			"Login realizado com sucesso",
		);
	}
}
