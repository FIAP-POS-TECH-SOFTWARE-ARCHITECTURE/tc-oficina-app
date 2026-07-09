import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UsuarioResponseDto } from "../../dto/usuario-response.dto";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../ports/usuarios.gateway";

@Injectable()
export class BuscarUsuarioUseCase {
	constructor(@Inject(USUARIOS_GATEWAY) private readonly gateway: UsuariosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<UsuarioResponseDto>> {
		const usuario = await this.gateway.buscarPorId(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");

		return SR.ok(UsuarioResponseDto.fromEntity(usuario));
	}
}
