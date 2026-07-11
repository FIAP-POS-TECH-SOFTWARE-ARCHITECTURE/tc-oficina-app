export const INSUMOS_GATEWAY = Symbol("INSUMOS_GATEWAY");

export interface InsumoRegistro {
	id: string;
	codigo: string;
	nome: string;
	descricao: string | null;
	precoUnitario: unknown;
	quantidadeEstoque: number;
	estoqueMinimo: number;
	ativo: boolean;
}

export interface MovimentoEstoqueDados {
	insumoId: string;
	quantidade: number;
	quantidadeAnterior: number;
	quantidadePosterior: number;
	motivo?: string;
	usuarioId: string;
}

export interface InsumosGatewayPort {
	criar(dados: {
		codigo: string;
		nome: string;
		descricao?: string;
		precoUnitario: number;
		estoqueMinimo: number;
		quantidadeEstoque: number;
	}): Promise<InsumoRegistro>;
	listarTodos(): Promise<InsumoRegistro[]>;
	buscarPorId(id: string): Promise<InsumoRegistro | null>;
	buscarPorCodigo(codigo: string): Promise<InsumoRegistro | null>;
	atualizar(
		id: string,
		dados: Partial<{ nome: string; descricao: string; precoUnitario: number; estoqueMinimo: number; ativo: boolean }>,
	): Promise<InsumoRegistro>;
	inativar(id: string): Promise<InsumoRegistro>;
	listarEstoqueBaixo(): Promise<InsumoRegistro[]>;
	listarMovimentos(insumoId: string): Promise<unknown[]>;
	registrarEntrada(dados: MovimentoEstoqueDados): Promise<InsumoRegistro>;
	registrarAjuste(dados: MovimentoEstoqueDados): Promise<InsumoRegistro>;
}
