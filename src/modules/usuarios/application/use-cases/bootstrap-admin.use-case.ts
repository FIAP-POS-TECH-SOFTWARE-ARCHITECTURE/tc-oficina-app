import { Inject, Injectable, Logger } from "@nestjs/common";
import { Role } from "../../../../common/enums/role.enum";
import { SENHA_HASHER, type SenhaHasherPort } from "../ports/senha-hasher.gateway";
import { USUARIOS_GATEWAY, type UsuariosGatewayPort } from "../ports/usuarios.gateway";

@Injectable()
export class BootstrapAdminUseCase {
	private readonly logger = new Logger(BootstrapAdminUseCase.name);

	constructor(
		@Inject(USUARIOS_GATEWAY) private readonly gateway: UsuariosGatewayPort,
		@Inject(SENHA_HASHER) private readonly hasher: SenhaHasherPort,
	) {}

	async execute(): Promise<void> {
		const adminCount = await this.gateway.contarAdminsAtivos();
		if (adminCount > 0) return;

		const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
		const senha = process.env.ADMIN_BOOTSTRAP_PASSWORD;

		if (!email || !senha) {
			this.logger.warn("Sem ADMIN_BOOTSTRAP_EMAIL/PASSWORD no .env — bootstrap de admin pulado.");
			return;
		}

		const exists = await this.gateway.buscarPorEmail(email);
		if (exists) return;

		const senhaHash = await this.hasher.hash(senha);
		try {
			await this.gateway.criar({
				nome: "Administrador",
				email,
				senhaHash,
				role: Role.ADMINISTRADOR,
			});

			this.logger.log(`Administrador inicial criado: ${email}`);
		} catch (error) {
			const jaCriado = await this.gateway.buscarPorEmail(email);

			if (jaCriado) {
				this.logger.log(`Administrador inicial já criado por outra instância: ${email}`);
				return;
			}

			throw error;
		}
	}
}
