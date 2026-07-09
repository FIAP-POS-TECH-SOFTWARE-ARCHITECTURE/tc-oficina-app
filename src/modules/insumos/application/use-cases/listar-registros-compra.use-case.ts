import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class ListarRegistrosCompraUseCase {
	constructor(@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort) {}

	async execute(): Promise<IServiceResponse<unknown>> {
		return SR.ok(await this.gateway.listarTodos());
	}
}
