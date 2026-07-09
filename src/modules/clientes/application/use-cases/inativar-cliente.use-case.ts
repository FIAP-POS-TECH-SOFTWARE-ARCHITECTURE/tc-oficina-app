import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { CLIENTES_GATEWAY, type ClienteRegistro, type ClientesGatewayPort } from "../ports/clientes.gateway";

@Injectable()
export class InativarClienteUseCase {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly gateway: ClientesGatewayPort) {}

	async execute(id: string): Promise<IServiceResponse<ClienteRegistro>> {
		const cliente = await this.gateway.buscarPorId(id);
		if (!cliente) return SR.notFound<ClienteRegistro>(undefined, "Cliente não encontrado");
		if (cliente.ativo === false) return SR.unprocessableEntity<ClienteRegistro>(undefined, "Cliente já está inativado");

		const aberto = await this.gateway.contarOrdensAbertas(id);
		if (aberto > 0)
			return SR.conflict<ClienteRegistro>(undefined, "Cliente possui ordens de serviço abertas e não pode ser inativado");

		const updated = await this.gateway.inativar(id);
		return SR.ok(updated, "Cliente inativado");
	}
}
