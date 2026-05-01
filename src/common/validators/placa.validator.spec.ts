import { isValidPlaca, normalizarPlaca } from "./placa.validator";

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
	});
});
