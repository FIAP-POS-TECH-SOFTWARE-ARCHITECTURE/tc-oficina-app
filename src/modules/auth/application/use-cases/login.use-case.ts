import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { SENHA_HASHER, type SenhaHasherPort } from "../../../usuarios/application/ports/senha-hasher.gateway";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../../../usuarios/application/ports/usuarios.gateway";
import { UsuarioResponseDto } from "../../../usuarios/dto/usuario-response.dto";
import { LoginResponseDto } from "../../dto/login-response.dto";
import { LoginDto } from "../../dto/login.dto";
import { TOKEN, type TokenPort } from "../ports/token.gateway";

@Injectable()
export class LoginUseCase {
	constructor(
		@Inject(USUARIOS_GATEWAY) private readonly usuarios: UsuariosGatewayPort,
		@Inject(SENHA_HASHER) private readonly hasher: SenhaHasherPort,
		@Inject(TOKEN) private readonly token: TokenPort,
	) {}

	async execute(dto: LoginDto): Promise<IServiceResponse<LoginResponseDto>> {
		const usuario = await this.usuarios.buscarPorEmail(dto.email);
		if (!usuario?.ativo) return SR.unauthorized<LoginResponseDto>(undefined, "Credenciais inválidas");

		const ok = await this.hasher.verificar(usuario.senhaHash, dto.senha);
		if (!ok) return SR.unauthorized<LoginResponseDto>(undefined, "Credenciais inválidas");

		const accessToken = await this.token.gerarToken({
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
