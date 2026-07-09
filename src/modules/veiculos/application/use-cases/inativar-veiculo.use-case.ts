import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { VEICULOS_GATEWAY, type VeiculoRegistro, type VeiculosGatewayPort } from "../ports/veiculos.gateway";

@Injectable()
export class InativarVeiculoUseCase {
	constructor(@Inject(VEICULOS_GATEWAY) private readonly gateway: VeiculosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<VeiculoRegistro>> {
		const veiculo = await this.gateway.buscarPorId(id);
		if (!veiculo) return SR.notFound<VeiculoRegistro>(undefined, "Veículo não encontrado");
		if (veiculo.ativo === false) return SR.unprocessableEntity<VeiculoRegistro>(undefined, "Veículo já está inativado");

		const aberto = await this.gateway.contarOrdensAbertas(id);
		if (aberto > 0)
			return SR.conflict<VeiculoRegistro>(undefined, "Veículo possui ordens de serviço abertas e não pode ser inativado");

		const updated = await this.gateway.inativar(id);
		return SR.ok(updated, "Veículo inativado");
	}
}
