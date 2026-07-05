export const CLIENTES_CONSULTA = Symbol("CLIENTES_CONSULTA");
export const VEICULOS_CONSULTA = Symbol("VEICULOS_CONSULTA");
export const SERVICOS_CONSULTA = Symbol("SERVICOS_CONSULTA");
export const INSUMOS_CONSULTA = Symbol("INSUMOS_CONSULTA");

export interface ClientesConsultaPort {
	buscarPorId(id: string): Promise<{ id: string; ativo: boolean; documento: string; nome: string; email: string | null } | null>;
}

export interface VeiculosConsultaPort {
	buscarPorId(id: string): Promise<{ id: string; ativo: boolean; clienteId: string } | null>;
}

export interface ServicosConsultaPort {
	buscarPorId(id: string): Promise<{ id: string; ativo: boolean; preco: unknown } | null>;
}

export interface InsumosConsultaPort {
	buscarPorId(id: string): Promise<{ id: string; ativo: boolean; precoUnitario: unknown; quantidadeEstoque: number } | null>;
}
