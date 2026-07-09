export const VEICULOS_GATEWAY = Symbol("VEICULOS_GATEWAY");

export interface VeiculoRegistro {
	id: string;
	placa: string;
	marca: string;
	modelo: string;
	ano: number;
	clienteId: string;
	ativo: boolean;
}

export interface VeiculosGatewayPort {
	criar(dados: { placa: string; marca: string; modelo: string; ano: number; clienteId: string }): Promise<VeiculoRegistro>;
	listarPorCliente(clienteId: string): Promise<VeiculoRegistro[]>;
	buscarPorId(id: string): Promise<VeiculoRegistro | null>;
	buscarPorPlaca(placa: string): Promise<VeiculoRegistro | null>;
	atualizar(id: string, dados: Partial<{ marca: string; modelo: string; ano: number; ativo: boolean }>): Promise<VeiculoRegistro>;
	inativar(id: string): Promise<VeiculoRegistro>;
	contarOrdensAbertas(veiculoId: string): Promise<number>;
}
