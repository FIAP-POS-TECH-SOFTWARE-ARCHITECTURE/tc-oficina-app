import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UpdateClienteDto } from "../../dto/update-cliente.dto";
import { CLIENTES_GATEWAY, type ClienteRegistro, type ClientesGatewayPort } from "../ports/clientes.gateway";

@Injectable()
export class AtualizarClienteUseCase {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly gateway: ClientesGatewayPort) {}

	async execute(id: string, dto: UpdateClienteDto): Promise<IServiceResponse<ClienteRegistro>> {
		const cliente = await this.gateway.buscarPorId(id);
		if (!cliente) return SR.notFound<ClienteRegistro>(undefined, "Cliente não encontrado");
		if (cliente.ativo === false) return SR.unprocessableEntity<ClienteRegistro>(undefined, "Cliente inativado");

		const updated = await this.gateway.atualizar(id, dto);
		return SR.ok(updated, "Cliente atualizado");
	}
}
