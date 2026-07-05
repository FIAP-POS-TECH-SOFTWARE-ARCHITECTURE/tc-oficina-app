import { Injectable, Logger } from "@nestjs/common";
import { NotificacaoMudancaStatus, NotificadorPort } from "../../application/ports/notificador.gateway";

@Injectable()
export class NotificadorLoggerGateway implements NotificadorPort {
	private readonly logger = new Logger(NotificadorLoggerGateway.name);

	notificarMudancaStatus(n: NotificacaoMudancaStatus): Promise<void> {
		this.logger.log(`OS ${n.numeroOs}: ${n.statusAnterior ?? "-"} -> ${n.statusNovo} (cliente: ${n.nomeCliente})`);
		return Promise.resolve();
	}
}
