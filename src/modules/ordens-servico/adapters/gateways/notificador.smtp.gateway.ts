import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";
import { NotificacaoMudancaStatus, NotificadorPort } from "../../application/ports/notificador.gateway";

@Injectable()
export class SmtpNotificadorGateway implements NotificadorPort {
	private readonly logger = new Logger(SmtpNotificadorGateway.name);
	private readonly transporter: Transporter;
	private readonly from: string;

	constructor() {
		this.from = process.env.SMTP_FROM ?? "oficina@localhost";
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST ?? "localhost",
			port: Number(process.env.SMTP_PORT ?? 1025),
			secure: false,
			auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
		});
	}

	async notificarMudancaStatus(n: NotificacaoMudancaStatus): Promise<void> {
		if (!n.emailCliente) {
			this.logger.warn(`OS ${n.numeroOs}: cliente ${n.nomeCliente} sem e-mail cadastrado; notificação pulada`);
			return;
		}
		try {
			await this.transporter.sendMail({
				from: this.from,
				to: n.emailCliente,
				subject: `[Oficina] Atualização da ${n.numeroOs}`,
				text:
					`Olá, ${n.nomeCliente}!\n\n` +
					`Sua ordem de serviço ${n.numeroOs} mudou de status:\n` +
					`${n.statusAnterior ?? "-"} -> ${n.statusNovo}\n` +
					(n.observacao ? `\nObservação: ${n.observacao}\n` : "") +
					`\nQualquer dúvida, entre em contato com a oficina.`,
			});
		} catch (error) {
			this.logger.error(`Falha ao notificar OS ${n.numeroOs}: ${(error as Error).message}`);
		}
	}
}
