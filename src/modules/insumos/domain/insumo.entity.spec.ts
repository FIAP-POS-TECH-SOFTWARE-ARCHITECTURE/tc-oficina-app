import { DomainError } from "../../../common/domain/domain-error";
import { Insumo } from "./insumo.entity";

describe("Insumo (entidade)", () => {
	const params = { codigo: "P-001", nome: "Filtro", precoUnitario: 10 };

	it("cria insumo ativo com defaults de estoque", () => {
		const insumo = Insumo.criar(params);
		expect(insumo.id).toBeNull();
		expect(insumo.codigo).toBe("P-001");
		expect(insumo.nome).toBe("Filtro");
		expect(insumo.quantidadeEstoque).toBe(0);
		expect(insumo.estoqueMinimo).toBe(0);
		expect(insumo.ativo).toBe(true);
	});

	it("mantém estoque informado", () => {
		const insumo = Insumo.criar({ ...params, quantidadeEstoque: 5, estoqueMinimo: 2 });
		expect(insumo.quantidadeEstoque).toBe(5);
		expect(insumo.estoqueMinimo).toBe(2);
	});

	it("lança DomainError sem código", () => {
		expect(() => Insumo.criar({ ...params, codigo: " " })).toThrow(DomainError);
		expect(() => Insumo.criar({ ...params, codigo: "" })).toThrow("Insumo precisa de código");
	});

	it("lança DomainError sem nome", () => {
		expect(() => Insumo.criar({ ...params, nome: "" })).toThrow("Insumo precisa de nome");
	});

	it("lança DomainError com quantidadeEstoque negativa", () => {
		expect(() => Insumo.criar({ ...params, quantidadeEstoque: -1 })).toThrow(
			"Quantidade em estoque não pode ser negativa",
		);
	});

	it("lança DomainError com estoqueMinimo negativo", () => {
		expect(() => Insumo.criar({ ...params, estoqueMinimo: -1 })).toThrow("Estoque mínimo não pode ser negativo");
	});
});
