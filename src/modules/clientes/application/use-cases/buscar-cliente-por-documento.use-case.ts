import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../../../common/validators/cpf-cnpj.validator";
import { CLIENTES_GATEWAY, type ClienteRegistro, type ClientesGatewayPort } from "../ports/clientes.gateway";

@Injectable()
export class BuscarClientePorDocumentoUseCase {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly gateway: ClientesGatewayPort) {}

	async execute(documento: string): Promise<IServiceResponse<ClienteRegistro>> {
		const cliente = await this.gateway.buscarPorDocumento(normalizeCpfOrCnpj(documento));
		if (!cliente) return SR.notFound<ClienteRegistro>(undefined, "Cliente não encontrado");

		return SR.ok(cliente);
	}
}
