import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../../../common/validators/cpf-cnpj.validator";
import { canTransition } from "../../domain/fluxo-estados-os";
import { OsStatus } from "../../domain/os-status";
import { NOTIFICADOR, type NotificadorPort } from "../ports/notificador.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class AprovarOrcamentoUseCase {
	private readonly logger = new Logger(AprovarOrcamentoUseCase.name);

	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(NOTIFICADOR) private readonly notificador: NotificadorPort,
	) {}

	async execute(numero: string, dto: { documento: string; observacao?: string | null }): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorNumero(numero);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (normalizeCpfOrCnpj(dto.documento) !== os.cliente.documento)
			return SR.forbidden(undefined, "Documento não confere com o cliente da OS");

		if (!canTransition(os.status, "aprovar_orcamento"))
			return SR.unprocessableEntity(undefined, `Não é possível aprovar a OS no status ${os.status}`);

		const resultado = await this.gateway.executarAprovacao(os, dto.observacao, new Date());
		const statusNovo = resultado.bloqueadaPorFaltaEstoque ? OsStatus.BLOQUEADA : OsStatus.EM_EXECUCAO;

		const detalhe = await this.gateway.buscarDetalhePorId(os.id);
		try {
			await this.notificador.notificarMudancaStatus({
				numeroOs: os.numero,
				statusAnterior: os.status,
				statusNovo,
				nomeCliente: os.cliente.nome,
				emailCliente: os.cliente.email,
				observacao: dto.observacao,
			});
		} catch (error) {
			this.logger.error("Falha ao notificar mudança de status", error instanceof Error ? error.stack : String(error));
		}

		if (resultado.bloqueadaPorFaltaEstoque) return SR.ok(detalhe, "Orçamento aprovado e OS bloqueada por falta de estoque");

		return SR.ok(detalhe, "Orçamento aprovado");
	}
}
