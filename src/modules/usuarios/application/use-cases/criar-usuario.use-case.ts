import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { Usuario } from "../../domain/usuario.entity";
import { CreateUsuarioDto } from "../../dto/create-usuario.dto";
import { UsuarioResponseDto } from "../../dto/usuario-response.dto";
import { SENHA_HASHER, type SenhaHasherPort } from "../ports/senha-hasher.gateway";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../ports/usuarios.gateway";

@Injectable()
export class CriarUsuarioUseCase {
	constructor(
		@Inject(USUARIOS_GATEWAY) private readonly gateway: UsuariosGatewayPort,
		@Inject(SENHA_HASHER) private readonly hasher: SenhaHasherPort,
	) {}

	async execute(dto: CreateUsuarioDto): Promise<IServiceResponse<UsuarioResponseDto>> {
		const exists = await this.gateway.buscarPorEmail(dto.email);
		if (exists) return SR.conflict<UsuarioResponseDto>(undefined, "E-mail já cadastrado");

		const senhaHash = await this.hasher.hash(dto.senha);
		const usuario = Usuario.criar({ nome: dto.nome, email: dto.email, senhaHash, role: dto.role });

		const created = await this.gateway.criar({
			nome: usuario.nome,
			email: usuario.email,
			senhaHash: usuario.senhaHash,
			role: dto.role,
		});

		return SR.created(UsuarioResponseDto.fromEntity(created), "Usuário criado");
	}
}
