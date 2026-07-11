import { DomainError } from "../../../common/domain/domain-error";
import { placaValida } from "./placa";

export class Veiculo {
	private constructor(
		readonly id: string | null,
		readonly placa: string,
		readonly marca: string,
		readonly modelo: string,
		readonly ano: number,
		readonly clienteId: string,
		readonly ativo: boolean,
	) {}

	static criar(params: { placa: string; marca: string; modelo: string; ano: number; clienteId: string }): Veiculo {
		if (!params.placa?.trim()) throw new DomainError("Veículo precisa de placa");
		if (!placaValida(params.placa)) throw new DomainError("Placa inválida");
		if (!params.clienteId?.trim()) throw new DomainError("Veículo precisa de cliente");
		return new Veiculo(null, params.placa, params.marca, params.modelo, params.ano, params.clienteId, true);
	}
}
