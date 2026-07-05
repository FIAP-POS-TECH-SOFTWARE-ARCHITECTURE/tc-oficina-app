import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { canTransition, nextStatus } from "../../domain/fluxo-estados-os";
import { NOTIFICADOR, type NotificadorPort } from "../ports/notificador.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class GerarOrcamentoUseCase {
	private readonly logger = new Logger(GerarOrcamentoUseCase.name);

	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(NOTIFICADOR) private readonly notificador: NotificadorPort,
	) {}

	async execute(id: string, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarDetalhePorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (!canTransition(os.status, "gerar_orcamento"))
			return SR.unprocessableEntity(undefined, `Não é possível gerar orçamento a partir do status ${os.status}`);

		if (os.itensServico.length === 0)
			return SR.unprocessableEntity(undefined, "Adicione ao menos um serviço antes de gerar o orçamento");

		const novo = nextStatus("gerar_orcamento");
		const valorTotal = this.gateway.calcularTotal(os);
		await this.gateway.transicionarComHistorico({
			id,
			statusAnterior: os.status,
			statusNovo: novo,
			usuarioId,
			observacao: "Orçamento gerado",
			dadosExtras: { valorTotal },
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		try {
			await this.notificador.notificarMudancaStatus({
				numeroOs: os.numero,
				statusAnterior: os.status,
				statusNovo: novo,
				nomeCliente: os.cliente.nome,
				emailCliente: os.cliente.email,
			});
		} catch (error) {
			this.logger.error("Falha ao notificar mudança de status", error instanceof Error ? error.stack : String(error));
		}
		return SR.ok(detalhe, "Orçamento gerado");
	}
}
