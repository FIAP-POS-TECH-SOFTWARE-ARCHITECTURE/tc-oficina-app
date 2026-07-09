import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UsuarioResponseDto } from "../../dto/usuario-response.dto";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../ports/usuarios.gateway";

@Injectable()
export class ListarUsuariosUseCase {
	constructor(@Inject(USUARIOS_GATEWAY) private readonly gateway: UsuariosGatewayPort) {}

	async execute(): Promise<IServiceResponse<UsuarioResponseDto[]>> {
		const usuarios = await this.gateway.listarTodos();
		return SR.ok(usuarios.map((usuario) => UsuarioResponseDto.fromEntity(usuario)));
	}
}
