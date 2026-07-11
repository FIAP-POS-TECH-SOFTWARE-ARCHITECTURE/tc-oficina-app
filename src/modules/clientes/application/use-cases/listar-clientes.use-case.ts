import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { CLIENTES_GATEWAY, type ClienteRegistro, type ClientesGatewayPort } from "../ports/clientes.gateway";

@Injectable()
export class ListarClientesUseCase {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly gateway: ClientesGatewayPort) {}

	async execute(): Promise<IServiceResponse<ClienteRegistro[]>> {
		return SR.ok(await this.gateway.listarTodos());
	}
}
