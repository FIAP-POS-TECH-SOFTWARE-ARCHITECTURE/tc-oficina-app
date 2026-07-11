export const FORNECEDOR = Symbol("FORNECEDOR");

export type FornecedorResposta = {
	aprovado: boolean;
	codigo: string;
	mensagem: string;
	payload: Record<string, unknown>;
};

export interface FornecedorPort {
	enviarCompra(params: { registroCompraId: string; insumoCodigo: string; quantidadeSolicitada: number }): FornecedorResposta;
}
