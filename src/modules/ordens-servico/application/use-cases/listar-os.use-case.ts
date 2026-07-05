import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
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

		const [total, items] = await this.gateway.listar({
			status: query.status,
			clienteId: query.clienteId,
			skip: (page - 1) * pageSize,
			take: pageSize,
		});

		return SR.ok({ total, page, pageSize, items });
	}
}
