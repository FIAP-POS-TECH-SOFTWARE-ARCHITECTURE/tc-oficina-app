import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { canTransition, nextStatus } from "../../domain/fluxo-estados-os";
import { NOTIFICADOR, type NotificadorPort } from "../ports/notificador.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class EntregarOsUseCase {
	private readonly logger = new Logger(EntregarOsUseCase.name);

	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(NOTIFICADOR) private readonly notificador: NotificadorPort,
	) {}

	async execute(id: string, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "entregar"))
			return SR.unprocessableEntity(undefined, `Transição inválida a partir do status ${os.status}`);

		const novo = nextStatus("entregar");
		await this.gateway.transicionarComHistorico({
			id,
			statusAnterior: os.status,
			statusNovo: novo,
			usuarioId,
			dadosExtras: { entregueEm: new Date() },
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		if (detalhe) {
			try {
				await this.notificador.notificarMudancaStatus({
					numeroOs: detalhe.numero,
					statusAnterior: os.status,
					statusNovo: novo,
					nomeCliente: detalhe.cliente.nome,
					emailCliente: detalhe.cliente.email,
				});
			} catch (error) {
				this.logger.error("Falha ao notificar mudança de status", error instanceof Error ? error.stack : String(error));
			}
		}
		return SR.ok(detalhe, `Status atualizado para ${novo}`);
	}
}
