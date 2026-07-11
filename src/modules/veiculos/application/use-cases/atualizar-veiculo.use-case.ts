import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UpdateVeiculoDto } from "../../dto/update-veiculo.dto";
import { VEICULOS_GATEWAY, type VeiculoRegistro, type VeiculosGatewayPort } from "../ports/veiculos.gateway";

@Injectable()
export class AtualizarVeiculoUseCase {
	constructor(@Inject(VEICULOS_GATEWAY) private readonly gateway: VeiculosGatewayPort) {}

	async execute(id: string, dto: UpdateVeiculoDto): Promise<IServiceResponse<VeiculoRegistro>> {
		const veiculo = await this.gateway.buscarPorId(id);
		if (!veiculo) return SR.notFound<VeiculoRegistro>(undefined, "Veículo não encontrado");
		if (veiculo.ativo === false) return SR.unprocessableEntity<VeiculoRegistro>(undefined, "Veículo inativado");

		const updated = await this.gateway.atualizar(id, dto);
		return SR.ok(updated, "Veículo atualizado");
	}
}
