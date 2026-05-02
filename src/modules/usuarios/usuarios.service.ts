import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import type { IServiceResponse } from "semantic-response";
import { Role } from "../../common/enums/role.enum";
import { SR } from "../../common/utils/service-response.util";
import { CreateUsuarioDto } from "./dto/create-usuario.dto";
import { UpdateSenhaDto } from "./dto/update-senha.dto";
import { UpdateUsuarioDto } from "./dto/update-usuario.dto";
import { UsuarioResponseDto } from "./dto/usuario-response.dto";
import { UsuariosRepository } from "./usuarios.repository";

@Injectable()
export class UsuariosService implements OnModuleInit {
	private readonly logger = new Logger(UsuariosService.name);

	constructor(private readonly repo: UsuariosRepository) {}

	async onModuleInit() {
		await this.bootstrapAdmin();
	}

	private async bootstrapAdmin() {
		const adminCount = await this.repo.countAdmins();
		if (adminCount > 0) return;

		const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
		const senha = process.env.ADMIN_BOOTSTRAP_PASSWORD;

		if (!email || !senha) {
			this.logger.warn("Sem ADMIN_BOOTSTRAP_EMAIL/PASSWORD no .env — bootstrap de admin pulado.");
			return;
		}

		const exists = await this.repo.findByEmail(email);
		if (exists) return;

		const senhaHash = await argon2.hash(senha);
		await this.repo.create({
			nome: "Administrador",
			email,
			senhaHash,
			role: Role.ADMINISTRADOR,
		});

		this.logger.log(`Administrador inicial criado: ${email}`);
	}

	async create(dto: CreateUsuarioDto): Promise<IServiceResponse<UsuarioResponseDto>> {
		const exists = await this.repo.findByEmail(dto.email);
		if (exists) return SR.conflict<UsuarioResponseDto>(undefined, "E-mail já cadastrado");

		const senhaHash = await argon2.hash(dto.senha);
		const created = await this.repo.create({
			nome: dto.nome,
			email: dto.email,
			senhaHash,
			role: dto.role,
		});

		return SR.created(UsuarioResponseDto.fromEntity(created), "Usuário criado");
	}

	async findAll(): Promise<IServiceResponse<UsuarioResponseDto[]>> {
		const usuarios = await this.repo.findAll();
		return SR.ok(usuarios.map((usuario) => UsuarioResponseDto.fromEntity(usuario)));
	}

	async findById(id: string): Promise<IServiceResponse<UsuarioResponseDto>> {
		const usuario = await this.repo.findById(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");

		return SR.ok(UsuarioResponseDto.fromEntity(usuario));
	}

	async update(id: string, dto: UpdateUsuarioDto): Promise<IServiceResponse<UsuarioResponseDto>> {
		const usuario = await this.repo.findById(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");

		if (dto.email && dto.email !== usuario.email) {
			const conflict = await this.repo.findByEmail(dto.email);
			if (conflict) return SR.conflict<UsuarioResponseDto>(undefined, "E-mail já cadastrado");
		}

		const updated = await this.repo.update(id, dto);
		return SR.ok(UsuarioResponseDto.fromEntity(updated), "Usuário atualizado");
	}

	async updateSenha(
		id: string,
		dto: UpdateSenhaDto,
		actor: { id: string; role: Role },
	): Promise<IServiceResponse<UsuarioResponseDto>> {
		if (actor.id !== id && actor.role !== Role.ADMINISTRADOR)
			return SR.forbidden<UsuarioResponseDto>(undefined, "Apenas o próprio usuário ou um administrador");

		const usuario = await this.repo.findById(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");

		const senhaHash = await argon2.hash(dto.senha);
		const updated = await this.repo.update(id, { senhaHash });

		return SR.ok(UsuarioResponseDto.fromEntity(updated), "Senha atualizada");
	}

	async remove(id: string): Promise<IServiceResponse<UsuarioResponseDto>> {
		const usuario = await this.repo.findById(id);
		if (!usuario) return SR.notFound<UsuarioResponseDto>(undefined, "Usuário não encontrado");

		const updated = await this.repo.softDelete(id);
		return SR.ok(UsuarioResponseDto.fromEntity(updated), "Usuário inativado");
	}
}
