import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { INSUMOS_GATEWAY, type InsumoRegistro, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class AlertasEstoqueBaixoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(): Promise<IServiceResponse<InsumoRegistro[]>> {
		return SR.ok(await this.gateway.listarEstoqueBaixo());
	}
}
