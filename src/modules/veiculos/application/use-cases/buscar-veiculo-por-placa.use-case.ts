import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizarPlaca } from "../../../../common/validators/placa.validator";
import { VEICULOS_GATEWAY, type VeiculoRegistro, type VeiculosGatewayPort } from "../ports/veiculos.gateway";

@Injectable()
export class BuscarVeiculoPorPlacaUseCase {
	constructor(@Inject(VEICULOS_GATEWAY) private readonly gateway: VeiculosGatewayPort) {}

	async execute(placa: string): Promise<IServiceResponse<VeiculoRegistro>> {
		const veiculo = await this.gateway.buscarPorPlaca(normalizarPlaca(placa));
		if (!veiculo) return SR.notFound<VeiculoRegistro>(undefined, "Veículo não encontrado");

		return SR.ok(veiculo);
	}
}
