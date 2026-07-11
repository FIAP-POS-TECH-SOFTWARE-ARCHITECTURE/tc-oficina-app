export const CLIENTES_GATEWAY = Symbol("CLIENTES_GATEWAY");

export interface ClienteRegistro {
	id: string;
	nome: string;
	documento: string;
	tipoDocumento: string;
	email: string | null;
	telefone: string | null;
	endereco: string | null;
	ativo: boolean;
}

export interface ClientesGatewayPort {
	criar(dados: {
		nome: string;
		documento: string;
		tipoDocumento: "CPF" | "CNPJ";
		email?: string;
		telefone?: string;
		endereco?: string;
	}): Promise<ClienteRegistro>;
	listarTodos(): Promise<ClienteRegistro[]>;
	buscarPorId(id: string): Promise<ClienteRegistro | null>;
	buscarPorDocumento(documento: string): Promise<ClienteRegistro | null>;
	atualizar(
		id: string,
		dados: Partial<{ nome: string; email: string; telefone: string; endereco: string; ativo: boolean }>,
	): Promise<ClienteRegistro>;
	inativar(id: string): Promise<ClienteRegistro>;
	contarOrdensAbertas(clienteId: string): Promise<number>;
}
