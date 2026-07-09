import { DomainError } from "../../../common/domain/domain-error";

export class Insumo {
	private constructor(
		readonly id: string | null,
		readonly codigo: string,
		readonly nome: string,
		readonly descricao: string | null,
		readonly precoUnitario: number,
		readonly quantidadeEstoque: number,
		readonly estoqueMinimo: number,
		readonly ativo: boolean,
	) {}

	static criar(params: {
		codigo: string;
		nome: string;
		descricao?: string | null;
		precoUnitario: number;
		quantidadeEstoque?: number;
		estoqueMinimo?: number;
	}): Insumo {
		if (!params.codigo?.trim()) throw new DomainError("Insumo precisa de código");
		if (!params.nome?.trim()) throw new DomainError("Insumo precisa de nome");
		const quantidadeEstoque = params.quantidadeEstoque ?? 0;
		const estoqueMinimo = params.estoqueMinimo ?? 0;
		if (quantidadeEstoque < 0) throw new DomainError("Quantidade em estoque não pode ser negativa");
		if (estoqueMinimo < 0) throw new DomainError("Estoque mínimo não pode ser negativo");
		return new Insumo(
			null,
			params.codigo,
			params.nome,
			params.descricao ?? null,
			params.precoUnitario,
			quantidadeEstoque,
			estoqueMinimo,
			true,
		);
	}
}
