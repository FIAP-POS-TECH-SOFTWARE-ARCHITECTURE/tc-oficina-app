import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { canTransition, nextStatus } from "../../domain/fluxo-estados-os";
import { NOTIFICADOR, type NotificadorPort } from "../ports/notificador.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class DesbloquearOsUseCase {
	private readonly logger = new Logger(DesbloquearOsUseCase.name);

	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(NOTIFICADOR) private readonly notificador: NotificadorPort,
	) {}

	async execute(id: string, usuarioId: string, dto: { observacao?: string | null }): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarDetalhePorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "desbloquear"))
			return SR.unprocessableEntity(undefined, `Não é possível desbloquear a OS no status ${os.status}`);

		const resultado = await this.gateway.executarDesbloqueio(os, usuarioId, dto.observacao, new Date());

		if (resultado.faltantes.length > 0) {
			return SR.unprocessableEntity(
				undefined,
				`Não é possível desbloquear a OS sem estoque disponível: ${resultado.faltantes.join("; ")}`,
			);
		}

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		try {
			await this.notificador.notificarMudancaStatus({
				numeroOs: os.numero,
				statusAnterior: os.status,
				statusNovo: nextStatus("desbloquear"),
				nomeCliente: os.cliente.nome,
				emailCliente: os.cliente.email,
				observacao: dto.observacao,
			});
		} catch (error) {
			this.logger.error("Falha ao notificar mudança de status", error instanceof Error ? error.stack : String(error));
		}
		return SR.ok(detalhe, "OS desbloqueada");
	}
}
