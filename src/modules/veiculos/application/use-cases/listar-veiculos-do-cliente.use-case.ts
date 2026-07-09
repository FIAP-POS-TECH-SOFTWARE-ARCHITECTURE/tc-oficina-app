import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { CLIENTES_GATEWAY, type ClientesGatewayPort } from "../../../clientes/application/ports/clientes.gateway";
import { VEICULOS_GATEWAY, type VeiculoRegistro, type VeiculosGatewayPort } from "../ports/veiculos.gateway";

@Injectable()
export class ListarVeiculosDoClienteUseCase {
	constructor(
		@Inject(VEICULOS_GATEWAY) private readonly gateway: VeiculosGatewayPort,
		@Inject(CLIENTES_GATEWAY) private readonly clientes: ClientesGatewayPort,
	) {}

	async execute(clienteId: string): Promise<IServiceResponse<VeiculoRegistro[]>> {
		const cliente = await this.clientes.buscarPorId(clienteId);
		if (!cliente) return SR.notFound<VeiculoRegistro[]>(undefined, "Cliente não encontrado");

		return SR.ok(await this.gateway.listarPorCliente(clienteId));
	}
}
