import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { Role } from "../../../../common/enums/role.enum";
import { SR } from "../../../../common/utils/service-response.util";
import { UpdateSenhaDto } from "../../dto/update-senha.dto";
import { UsuarioResponseDto } from "../../dto/usuario-response.dto";
import { SENHA_HASHER, type SenhaHasherPort } from "../ports/senha-hasher.gateway";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../ports/usuarios.gateway";

@Injectable()
export class AtualizarSenhaUsuarioUseCase {
	constructor(
		@Inject(USUARIOS_GATEWAY) private readonly gateway: UsuariosGatewayPort,
		@Inject(SENHA_HASHER) private readonly hasher: SenhaHasherPort,
	) {}

	async execute(
		id: string,
		dto: UpdateSenhaDto,
		actor: { id: string; role: Role },
	): Promise<IServiceResponse<UsuarioResponseDto>> {
		if (actor.id !== id && actor.role !== Role.ADMINISTRADOR)
			return SR.forbidden<UsuarioResponseDto>(undefined, "Apenas o próprio usuário ou um administrador");

		const usuario = await this.gateway.buscarPorId(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");
		if (usuario.ativo === false) return SR.unprocessableEntity<UsuarioResponseDto>(undefined, "Usuário inativado");

		const senhaHash = await this.hasher.hash(dto.senha);
		const updated = await this.gateway.atualizar(id, { senhaHash });

		return SR.ok(UsuarioResponseDto.fromEntity(updated), "Senha atualizada");
	}
}
