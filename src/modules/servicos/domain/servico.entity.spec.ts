import { DomainError } from "../../../common/domain/domain-error";
import { Servico } from "./servico.entity";

describe("Servico (entidade)", () => {
	it("cria serviço ativo com dados válidos", () => {
		const servico = Servico.criar({ nome: "Troca de óleo", preco: 150, tempoEstimadoMin: 60 });
		expect(servico.id).toBeNull();
		expect(servico.nome).toBe("Troca de óleo");
		expect(servico.descricao).toBeNull();
		expect(servico.preco).toBe(150);
		expect(servico.ativo).toBe(true);
	});

	it("aceita preço zero", () => {
		expect(Servico.criar({ nome: "Cortesia", preco: 0, tempoEstimadoMin: 10 }).preco).toBe(0);
	});

	it("lança DomainError quando nome está vazio", () => {
		expect(() => Servico.criar({ nome: " ", preco: 10, tempoEstimadoMin: 10 })).toThrow(DomainError);
		expect(() => Servico.criar({ nome: "", preco: 10, tempoEstimadoMin: 10 })).toThrow("Serviço precisa de nome");
	});

	it("lança DomainError quando preço é negativo", () => {
		expect(() => Servico.criar({ nome: "X", preco: -1, tempoEstimadoMin: 10 })).toThrow("Preço do serviço não pode ser negativo");
	});
});
