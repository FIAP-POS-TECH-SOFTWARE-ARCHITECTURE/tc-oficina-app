import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { SERVICOS_GATEWAY, type ServicoRegistro, type ServicosGatewayPort } from "../ports/servicos.gateway";

@Injectable()
export class ListarServicosUseCase {
	constructor(@Inject(SERVICOS_GATEWAY) private readonly gateway: ServicosGatewayPort) {}

	async execute(): Promise<IServiceResponse<ServicoRegistro[]>> {
		return SR.ok(await this.gateway.listarTodos());
	}
}
