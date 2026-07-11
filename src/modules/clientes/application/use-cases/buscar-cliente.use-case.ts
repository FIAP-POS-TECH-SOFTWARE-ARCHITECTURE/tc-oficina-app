import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { CLIENTES_GATEWAY, type ClienteRegistro, type ClientesGatewayPort } from "../ports/clientes.gateway";

@Injectable()
export class BuscarClienteUseCase {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly gateway: ClientesGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<ClienteRegistro>> {
		const cliente = await this.gateway.buscarPorId(id);
		if (!cliente) return SR.notFound<ClienteRegistro>(undefined, "Cliente não encontrado");

		return SR.ok(cliente);
	}
}
