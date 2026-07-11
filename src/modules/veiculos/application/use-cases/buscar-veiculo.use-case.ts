import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { VEICULOS_GATEWAY, type VeiculoRegistro, type VeiculosGatewayPort } from "../ports/veiculos.gateway";

@Injectable()
export class BuscarVeiculoUseCase {
	constructor(@Inject(VEICULOS_GATEWAY) private readonly gateway: VeiculosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<VeiculoRegistro>> {
		const veiculo = await this.gateway.buscarPorId(id);
		if (!veiculo) return SR.notFound<VeiculoRegistro>(undefined, "Veículo não encontrado");

		return SR.ok(veiculo);
	}
}
