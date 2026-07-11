import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UpdateUsuarioDto } from "../../dto/update-usuario.dto";
import { UsuarioResponseDto } from "../../dto/usuario-response.dto";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../ports/usuarios.gateway";

@Injectable()
export class AtualizarUsuarioUseCase {
	constructor(@Inject(USUARIOS_GATEWAY) private readonly gateway: UsuariosGatewayPort) {}

	async execute(id: string, dto: UpdateUsuarioDto): Promise<IServiceResponse<UsuarioResponseDto>> {
		const usuario = await this.gateway.buscarPorId(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");
		if (usuario.ativo === false) return SR.unprocessableEntity<UsuarioResponseDto>(undefined, "Usuário inativado");

		if (dto.email && dto.email !== usuario.email) {
			const conflict = await this.gateway.buscarPorEmail(dto.email);
			if (conflict) return SR.conflict<UsuarioResponseDto>(undefined, "E-mail já cadastrado");
		}

		const updated = await this.gateway.atualizar(id, dto);
		return SR.ok(UsuarioResponseDto.fromEntity(updated), "Usuário atualizado");
	}
}
