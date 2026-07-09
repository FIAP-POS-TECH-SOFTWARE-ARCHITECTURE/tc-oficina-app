import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { INSUMOS_GATEWAY, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class ListarMovimentosInsumoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<unknown[]>> {
		const insumo = await this.gateway.buscarPorId(id);
		if (!insumo) return SR.notFound<unknown[]>(undefined, "Insumo não encontrado");

		return SR.ok(await this.gateway.listarMovimentos(id));
	}
}
