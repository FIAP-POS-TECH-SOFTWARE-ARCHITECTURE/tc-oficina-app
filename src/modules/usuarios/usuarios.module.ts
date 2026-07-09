import { Module, OnModuleInit } from "@nestjs/common";
import { Argon2HasherGateway } from "./adapters/gateways/argon2-hasher.gateway";
import { UsuariosPrismaGateway } from "./adapters/gateways/usuarios.prisma.gateway";
import { UsuariosController } from "./adapters/usuarios.controller";
import { SENHA_HASHER } from "./application/ports/senha-hasher.gateway";
import { USUARIOS_GATEWAY } from "./application/ports/usuarios.gateway";
import { AtualizarSenhaUsuarioUseCase } from "./application/use-cases/atualizar-senha-usuario.use-case";
import { AtualizarUsuarioUseCase } from "./application/use-cases/atualizar-usuario.use-case";
import { BootstrapAdminUseCase } from "./application/use-cases/bootstrap-admin.use-case";
import { BuscarUsuarioUseCase } from "./application/use-cases/buscar-usuario.use-case";
import { CriarUsuarioUseCase } from "./application/use-cases/criar-usuario.use-case";
import { InativarUsuarioUseCase } from "./application/use-cases/inativar-usuario.use-case";
import { ListarUsuariosUseCase } from "./application/use-cases/listar-usuarios.use-case";

const useCases = [
	CriarUsuarioUseCase,
	ListarUsuariosUseCase,
	BuscarUsuarioUseCase,
	AtualizarUsuarioUseCase,
	AtualizarSenhaUsuarioUseCase,
	InativarUsuarioUseCase,
	BootstrapAdminUseCase,
];

@Module({
	controllers: [UsuariosController],
	providers: [
		...useCases,
		{ provide: USUARIOS_GATEWAY, useClass: UsuariosPrismaGateway },
		{ provide: SENHA_HASHER, useClass: Argon2HasherGateway },
	],
	exports: [USUARIOS_GATEWAY, SENHA_HASHER],
})
export class UsuariosModule implements OnModuleInit {
	constructor(private readonly bootstrapAdmin: BootstrapAdminUseCase) {}

	async onModuleInit() {
		await this.bootstrapAdmin.execute();
	}
}
