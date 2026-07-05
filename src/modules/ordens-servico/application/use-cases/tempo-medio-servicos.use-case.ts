import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class TempoMedioServicosUseCase {
	constructor(@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort) {}

	async execute(filtro: "ativos" | "inativos" | "ambos" = "ativos"): Promise<IServiceResponse<unknown>> {
		const dados = await this.gateway.tempoMedioPorServico(filtro);
		return SR.ok(
			dados.map((d) => ({
				servicoId: d.servico_id,
				nome: d.nome,
				ativo: d.ativo,
				tempoMedioMin: d.tempo_medio_min,
				totalExecucoes: d.total_execucoes,
			})),
		);
	}
}
