import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { OsStatus } from "../../domain/os-status";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class AtualizarDiagnosticoUseCase {
	constructor(@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort) {}

	async execute(id: string, dto: { diagnostico: string }): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Diagnóstico só pode ser atualizado quando a OS está em diagnóstico");

		await this.gateway.atualizarDiagnostico(id, dto.diagnostico);

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Diagnóstico atualizado");
	}
}
