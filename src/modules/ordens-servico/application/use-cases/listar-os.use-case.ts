import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { compararParaListagem, STATUS_OCULTOS_LISTAGEM } from "../../domain/ordenacao-listagem";
import { OsStatus } from "../../domain/os-status";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class ListarOsUseCase {
	constructor(@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort) {}

	async execute(query: {
		status?: OsStatus;
		clienteId?: string;
		page?: number;
		pageSize?: number;
	}): Promise<IServiceResponse<unknown>> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 20;

		const todas = await this.gateway.listarParaOrdenacao({
			status: query.status,
			excluirStatus: query.status ? undefined : STATUS_OCULTOS_LISTAGEM,
			clienteId: query.clienteId,
		});

		const ordenadas = [...todas].sort(compararParaListagem);
		const items = ordenadas.slice((page - 1) * pageSize, page * pageSize);
		return SR.ok({ total: ordenadas.length, page, pageSize, items });
	}
}
