import { placaValida } from "./placa";

describe("placaValida", () => {
	it("aceita placa no padrão antigo", () => {
		expect(placaValida("ABC1234")).toBe(true);
		expect(placaValida("abc-1234")).toBe(true);
	});

	it("aceita placa no padrão Mercosul", () => {
		expect(placaValida("ABC1D23")).toBe(true);
	});

	it("rejeita placa inválida", () => {
		expect(placaValida("AB1234")).toBe(false);
		expect(placaValida("")).toBe(false);
		expect(placaValida(undefined as unknown as string)).toBe(false);
	});
});
