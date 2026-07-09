import { DomainError } from "../../../common/domain/domain-error";

export class Cliente {
	private constructor(
		readonly id: string | null,
		readonly nome: string,
		readonly documento: string,
		readonly email: string | null,
		readonly ativo: boolean,
	) {}

	static criar(params: { nome: string; documento: string; email?: string | null }): Cliente {
		if (!params.nome?.trim()) throw new DomainError("Cliente precisa de nome");
		if (!params.documento?.trim()) throw new DomainError("Cliente precisa de CPF/CNPJ");
		return new Cliente(null, params.nome, params.documento, params.email ?? null, true);
	}
}
