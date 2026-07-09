export const SERVICOS_GATEWAY = Symbol("SERVICOS_GATEWAY");

export interface ServicoRegistro {
	id: string;
	nome: string;
	descricao: string | null;
	preco: unknown;
	tempoEstimadoMin: number;
	ativo: boolean;
}

export interface ServicosGatewayPort {
	criar(dados: { nome: string; descricao?: string; preco: number; tempoEstimadoMin: number }): Promise<ServicoRegistro>;
	listarTodos(): Promise<ServicoRegistro[]>;
	buscarPorId(id: string): Promise<ServicoRegistro | null>;
	buscarPorNome(nome: string): Promise<ServicoRegistro | null>;
	atualizar(
		id: string,
		dados: Partial<{ nome: string; descricao: string; preco: number; tempoEstimadoMin: number; ativo: boolean }>,
	): Promise<ServicoRegistro>;
	inativar(id: string): Promise<ServicoRegistro>;
}
