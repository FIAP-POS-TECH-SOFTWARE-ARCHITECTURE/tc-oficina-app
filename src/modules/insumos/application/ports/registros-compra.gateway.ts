export const REGISTROS_COMPRA_GATEWAY = Symbol("REGISTROS_COMPRA_GATEWAY");

export interface RegistroCompraRegistro {
	id: string;
	status: string;
	insumoId: string;
	quantidadeSolicitada: number;
}

export interface RegistroCompraDetalhe extends RegistroCompraRegistro {
	insumo: { codigo: string };
}

export interface AtualizacaoRegistroCompra {
	status?: string;
	fornecedorRespostaCodigo?: string | null;
	fornecedorMensagem?: string | null;
	fornecedorPayload?: unknown;
	motivoRecusa?: string | null;
	motivoCancelamento?: string | null;
	aprovadoEm?: Date | null;
	recusadoEm?: Date | null;
	canceladoEm?: Date | null;
}

export interface RecebimentoCompraDados {
	registroId: string;
	insumoId: string;
	quantidade: number;
	usuarioId: string;
	motivo: string;
	notaFiscal: {
		numero: string;
		chave?: string;
		arquivoNome: string;
		arquivoTipo: string;
		arquivoTamanho: number;
		arquivoUrl: string;
	};
}

export interface RegistrosCompraGatewayPort {
	criar(dados: {
		insumoId: string;
		quantidadeSolicitada: number;
		solicitadoPorId: string;
		ordemServicoId?: string;
	}): Promise<{ id: string }>;
	listarTodos(): Promise<unknown[]>;
	buscarPorId(id: string): Promise<RegistroCompraRegistro | null>;
	buscarDetalhePorId(id: string): Promise<RegistroCompraDetalhe | null>;
	atualizar(id: string, dados: AtualizacaoRegistroCompra): Promise<unknown>;
	ordemServicoExiste(ordemServicoId: string): Promise<boolean>;
	receberComEntradaEstoque(dados: RecebimentoCompraDados): Promise<void>;
}
