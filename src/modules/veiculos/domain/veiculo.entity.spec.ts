import { DomainError } from "../../../common/domain/domain-error";
import { Veiculo } from "./veiculo.entity";

describe("Veiculo (entidade)", () => {
	const params = { placa: "ABC1234", marca: "Toyota", modelo: "Corolla", ano: 2024, clienteId: "c1" };

	it("cria veículo ativo com dados válidos", () => {
		const veiculo = Veiculo.criar(params);
		expect(veiculo.id).toBeNull();
		expect(veiculo.placa).toBe("ABC1234");
		expect(veiculo.clienteId).toBe("c1");
		expect(veiculo.ativo).toBe(true);
	});

	it("lança DomainError quando placa está vazia", () => {
		expect(() => Veiculo.criar({ ...params, placa: "" })).toThrow(DomainError);
		expect(() => Veiculo.criar({ ...params, placa: "  " })).toThrow("Veículo precisa de placa");
	});

	it("lança DomainError quando placa tem formato inválido", () => {
		expect(() => Veiculo.criar({ ...params, placa: "ZZ999" })).toThrow("Placa inválida");
	});

	it("lança DomainError quando clienteId está vazio", () => {
		expect(() => Veiculo.criar({ ...params, clienteId: "" })).toThrow("Veículo precisa de cliente");
	});
});
