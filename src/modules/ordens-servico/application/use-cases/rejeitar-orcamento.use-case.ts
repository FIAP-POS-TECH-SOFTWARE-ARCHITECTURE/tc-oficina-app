import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../../../common/validators/cpf-cnpj.validator";
import { canTransition, nextStatus } from "../../domain/fluxo-estados-os";
import { NOTIFICADOR, type NotificadorPort } from "../ports/notificador.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class RejeitarOrcamentoUseCase {
	private readonly logger = new Logger(RejeitarOrcamentoUseCase.name);

	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(NOTIFICADOR) private readonly notificador: NotificadorPort,
	) {}

	async execute(numero: string, dto: { documento: string; observacao?: string | null }): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorNumero(numero);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (normalizeCpfOrCnpj(dto.documento) !== os.cliente.documento)
			return SR.forbidden(undefined, "Documento não confere com o cliente da OS");

		if (!canTransition(os.status, "rejeitar_orcamento"))
			return SR.unprocessableEntity(undefined, `Não é possível rejeitar a OS no status ${os.status}`);

		const novo = nextStatus("rejeitar_orcamento");
		await this.gateway.transicionarComHistorico({
			id: os.id,
			statusAnterior: os.status,
			statusNovo: novo,
			observacao: dto.observacao ?? "Orçamento rejeitado pelo cliente",
			dadosExtras: { canceladoEm: new Date() },
		});

		const detalhe = await this.gateway.buscarDetalhePorId(os.id);
		try {
			await this.notificador.notificarMudancaStatus({
				numeroOs: os.numero,
				statusAnterior: os.status,
				statusNovo: novo,
				nomeCliente: os.cliente.nome,
				emailCliente: os.cliente.email,
				observacao: dto.observacao,
			});
		} catch (error) {
			this.logger.error("Falha ao notificar mudança de status", error instanceof Error ? error.stack : String(error));
		}
		return SR.ok(detalhe, "Orçamento rejeitado");
	}
}
