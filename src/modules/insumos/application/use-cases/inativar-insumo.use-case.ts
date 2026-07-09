import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { INSUMOS_GATEWAY, type InsumoRegistro, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class InativarInsumoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<InsumoRegistro>> {
		const insumo = await this.gateway.buscarPorId(id);
		if (!insumo) return SR.notFound<InsumoRegistro>(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity<InsumoRegistro>(undefined, "Insumo já está inativado");

		const updated = await this.gateway.inativar(id);
		return SR.ok(updated, "Insumo inativado");
	}
}
