import { Injectable } from "@nestjs/common";
import { FornecedorPort, FornecedorResposta } from "../../application/ports/fornecedor.gateway";

@Injectable()
export class FornecedorStubGateway implements FornecedorPort {
	enviarCompra(params: { registroCompraId: string; insumoCodigo: string; quantidadeSolicitada: number }): FornecedorResposta {
		const aprovado = params.quantidadeSolicitada <= 50;
		return {
			aprovado,
			codigo: aprovado ? "APROVADO_STUB" : "RECUSADO_STUB",
			mensagem: aprovado
				? "Stub fornecedor: compra aprovada para processamento"
				: "Stub fornecedor: compra recusada por limite de quantidade",
			payload: {
				registroCompraId: params.registroCompraId,
				insumoCodigo: params.insumoCodigo,
				quantidadeSolicitada: params.quantidadeSolicitada,
				origem: "fornecedor_stub",
			},
		};
	}
}
