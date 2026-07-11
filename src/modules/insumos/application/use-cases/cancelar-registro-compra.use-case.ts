import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { CancelarRegistroCompraDto } from "../../dto/cancelar-registro-compra.dto";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class CancelarRegistroCompraUseCase {
	constructor(@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort) {}

	async execute(id: string, dto: CancelarRegistroCompraDto): Promise<IServiceResponse<unknown>> {
		const registro = await this.gateway.buscarPorId(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status === "RECEBIDO") return SR.unprocessableEntity(undefined, "Não é possível cancelar um registro já recebido");

		if (registro.status === "CANCELADO") return SR.unprocessableEntity(undefined, "Registro de compra já está cancelado");

		await this.gateway.atualizar(id, {
			status: "CANCELADO",
			motivoCancelamento: dto.motivo,
			canceladoEm: new Date(),
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Pedido de compra cancelado");
	}
}
