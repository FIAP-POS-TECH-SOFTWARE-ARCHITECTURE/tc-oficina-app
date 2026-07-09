import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { SERVICOS_GATEWAY, type ServicoRegistro, type ServicosGatewayPort } from "../ports/servicos.gateway";

@Injectable()
export class BuscarServicoUseCase {
	constructor(@Inject(SERVICOS_GATEWAY) private readonly gateway: ServicosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<ServicoRegistro>> {
		const servico = await this.gateway.buscarPorId(id);
		if (!servico) return SR.notFound<ServicoRegistro>(undefined, "Serviço não encontrado");

		return SR.ok(servico);
	}
}
