import { DomainError } from "../../../common/domain/domain-error";
import { Cliente } from "./cliente.entity";

describe("Cliente (entidade)", () => {
	it("cria cliente ativo com dados válidos", () => {
		const cliente = Cliente.criar({ nome: "João Silva", documento: "52998224725" });
		expect(cliente.id).toBeNull();
		expect(cliente.nome).toBe("João Silva");
		expect(cliente.documento).toBe("52998224725");
		expect(cliente.email).toBeNull();
		expect(cliente.ativo).toBe(true);
	});

	it("mantém email quando informado", () => {
		const cliente = Cliente.criar({ nome: "João", documento: "52998224725", email: "joao@email.com" });
		expect(cliente.email).toBe("joao@email.com");
	});

	it("lança DomainError quando nome está vazio", () => {
		expect(() => Cliente.criar({ nome: "   ", documento: "52998224725" })).toThrow(DomainError);
		expect(() => Cliente.criar({ nome: "", documento: "52998224725" })).toThrow("Cliente precisa de nome");
	});

	it("lança DomainError quando documento está vazio", () => {
		expect(() => Cliente.criar({ nome: "João", documento: "" })).toThrow(DomainError);
		expect(() => Cliente.criar({ nome: "João", documento: "  " })).toThrow("Cliente precisa de CPF/CNPJ");
	});
});
