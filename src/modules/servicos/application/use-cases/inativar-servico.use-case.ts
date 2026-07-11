import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { SERVICOS_GATEWAY, type ServicoRegistro, type ServicosGatewayPort } from "../ports/servicos.gateway";

@Injectable()
export class InativarServicoUseCase {
	constructor(@Inject(SERVICOS_GATEWAY) private readonly gateway: ServicosGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<ServicoRegistro>> {
		const servico = await this.gateway.buscarPorId(id);
		if (!servico) return SR.notFound<ServicoRegistro>(undefined, "Serviço não encontrado");
		if (servico.ativo === false) return SR.unprocessableEntity<ServicoRegistro>(undefined, "Serviço já está inativado");

		const updated = await this.gateway.inativar(id);
		return SR.ok(updated, "Serviço inativado");
	}
}
