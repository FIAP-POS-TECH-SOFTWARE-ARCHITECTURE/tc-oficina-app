import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { OsStatus } from "../../domain/os-status";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class RemoverItemServicoUseCase {
	constructor(@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort) {}

	async execute(id: string, itemId: string): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser removidos antes da geração do orçamento");

		const item = await this.gateway.buscarItemServico(itemId);
		if (item?.ordemServicoId !== id) return SR.notFound(undefined, "Item não encontrado");

		await this.gateway.removerItemServico(itemId);

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Item removido");
	}
}
