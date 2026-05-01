import { Injectable } from "@nestjs/common";

export type FornecedorStubResponse = {
	aprovado: boolean;
	codigo: string;
	mensagem: string;
	payload: Record<string, unknown>;
};

@Injectable()
export class FornecedorStubService {
	enviarCompra(params: { registroCompraId: string; insumoCodigo: string; quantidadeSolicitada: number }): FornecedorStubResponse {
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
