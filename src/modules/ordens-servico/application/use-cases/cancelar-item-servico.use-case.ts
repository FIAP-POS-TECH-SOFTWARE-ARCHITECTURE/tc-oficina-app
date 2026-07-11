import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { OsStatus } from "../../domain/os-status";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class CancelarItemServicoUseCase {
	constructor(@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort) {}

	async execute(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.EM_EXECUCAO)
			return SR.unprocessableEntity(undefined, "Serviço só pode ser cancelado com a OS em execução");

		const item = await this.gateway.buscarItemServico(itemId);
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");
		if (item.status === "CONCLUIDO" || item.status === "CANCELADO")
			return SR.unprocessableEntity(undefined, "Serviço já concluído ou cancelado");

		await this.gateway.cancelarItemServico(itemId);

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Serviço cancelado");
	}
}
