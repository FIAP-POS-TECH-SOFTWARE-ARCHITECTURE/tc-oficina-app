import { IsPlacaVeiculoConstraint, isValidPlaca, normalizarPlaca } from "./placa.validator";

describe("Placa validator", () => {
	describe("isValidPlaca", () => {
		it.each([
			["ABC1234", true],
			["ABC-1234", true],
			["abc-1234", true],
			["ABC1D23", true],
			["AAA0A00", true],
			["AB1234", false],
			["ABCD1234", false],
			["ABC12345", false],
			["1234567", false],
			["", false],
		])("isValidPlaca(%s) = %s", (value, expected) => {
			expect(isValidPlaca(value)).toBe(expected);
		});
	});

	describe("normalizarPlaca", () => {
		it("remove hífen e força uppercase", () => {
			expect(normalizarPlaca("abc-1234")).toBe("ABC1234");
			expect(normalizarPlaca("aaa0a00")).toBe("AAA0A00");
			expect(normalizarPlaca("  abc 1d23  ")).toBe("ABC1D23");
		});

		it("retorna string vazia quando recebe null/undefined", () => {
			expect(normalizarPlaca(null as any)).toBe("");

			expect(normalizarPlaca(undefined as any)).toBe("");
		});
	});

	describe("isValidPlaca com tipos não-string", () => {
		it("retorna false para null e undefined", () => {
			expect(isValidPlaca(null as any)).toBe(false);

			expect(isValidPlaca(undefined as any)).toBe(false);
		});
	});

	describe("IsPlacaVeiculoConstraint", () => {
		it("validate retorna true para placa válida", () => {
			const constraint = new IsPlacaVeiculoConstraint();
			expect(constraint.validate("ABC1234")).toBe(true);
		});

		it("validate retorna false para valor não-string", () => {
			const constraint = new IsPlacaVeiculoConstraint();
			expect(constraint.validate(1234567)).toBe(false);
			expect(constraint.validate(null)).toBe(false);
		});

		it("defaultMessage retorna mensagem de erro", () => {
			const constraint = new IsPlacaVeiculoConstraint();
			expect(constraint.defaultMessage()).toContain("Placa inválida");
		});
	});
});
