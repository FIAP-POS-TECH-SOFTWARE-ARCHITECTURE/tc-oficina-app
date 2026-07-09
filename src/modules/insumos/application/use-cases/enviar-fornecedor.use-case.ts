import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { FORNECEDOR, type FornecedorPort } from "../ports/fornecedor.gateway";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class EnviarFornecedorUseCase {
	constructor(
		@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort,
		@Inject(FORNECEDOR) private readonly fornecedor: FornecedorPort,
	) {}

	async execute(id: string): Promise<IServiceResponse<unknown>> {
		const registro = await this.gateway.buscarDetalhePorId(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status !== "CRIADO")
			return SR.unprocessableEntity(undefined, `Não é possível enviar para fornecedor no status ${registro.status}`);

		const resposta = this.fornecedor.enviarCompra({
			registroCompraId: registro.id,
			insumoCodigo: registro.insumo.codigo,
			quantidadeSolicitada: registro.quantidadeSolicitada,
		});

		await this.gateway.atualizar(id, {
			status: resposta.aprovado ? "APROVADO_FORNECEDOR" : "RECUSADO_FORNECEDOR",
			fornecedorRespostaCodigo: resposta.codigo,
			fornecedorMensagem: resposta.mensagem,
			fornecedorPayload: resposta.payload,
			aprovadoEm: resposta.aprovado ? new Date() : null,
			recusadoEm: resposta.aprovado ? null : new Date(),
			motivoRecusa: resposta.aprovado ? null : resposta.mensagem,
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Resposta do fornecedor registrada (stub)");
	}
}
