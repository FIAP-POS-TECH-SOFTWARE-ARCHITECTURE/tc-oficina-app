import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class BuscarRegistroCompraUseCase {
	constructor(@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<unknown>> {
		const registro = await this.gateway.buscarDetalhePorId(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		return SR.ok(registro);
	}
}
