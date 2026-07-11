import { DomainError } from "../../../common/domain/domain-error";

export class Servico {
	private constructor(
		readonly id: string | null,
		readonly nome: string,
		readonly descricao: string | null,
		readonly preco: number,
		readonly tempoEstimadoMin: number,
		readonly ativo: boolean,
	) {}

	static criar(params: { nome: string; descricao?: string | null; preco: number; tempoEstimadoMin: number }): Servico {
		if (!params.nome?.trim()) throw new DomainError("Serviço precisa de nome");
		if (params.preco < 0) throw new DomainError("Preço do serviço não pode ser negativo");
		return new Servico(null, params.nome, params.descricao ?? null, params.preco, params.tempoEstimadoMin, true);
	}
}
