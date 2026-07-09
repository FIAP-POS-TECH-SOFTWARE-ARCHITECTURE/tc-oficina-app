import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UpdateInsumoDto } from "../../dto/update-insumo.dto";
import { INSUMOS_GATEWAY, type InsumoRegistro, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class AtualizarInsumoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(id: string, dto: UpdateInsumoDto): Promise<IServiceResponse<InsumoRegistro>> {
		const insumo = await this.gateway.buscarPorId(id);
		if (!insumo) return SR.notFound<InsumoRegistro>(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity<InsumoRegistro>(undefined, "Insumo inativado");

		const updated = await this.gateway.atualizar(id, dto);
		return SR.ok(updated, "Insumo atualizado");
	}
}
