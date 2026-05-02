import { isValidCpf, isValidCnpj, isValidCpfOrCnpj, normalizeCpfOrCnpj, onlyDigits } from "./cpf-cnpj.validator";

describe("CPF/CNPJ validator", () => {
	describe("CPF", () => {
		it.each([
			["529.982.247-25", true],
			["52998224725", true],
			["111.444.777-35", true],
			["123.456.789-09", true],
			["000.000.000-00", false],
			["111.111.111-11", false],
			["123.456.789-00", false],
			["1234567890", false],
			["", false],
		])("isValidCpf(%s) = %s", (value, expected) => {
			expect(isValidCpf(value)).toBe(expected);
		});
	});

	describe("CNPJ", () => {
		it.each([
			["11.222.333/0001-81", true],
			["11222333000181", true],
			["12ABC34501DE35", true],
			["12.ABC.345/01DE-35", true],
			["00.000.000/0000-00", false],
			["11.111.111/1111-11", false],
			["11.222.333/0001-00", false],
			["12ABC34501DE00", false],
			["", false],
		])("isValidCnpj(%s) = %s", (value, expected) => {
			expect(isValidCnpj(value)).toBe(expected);
		});
	});

	describe("isValidCpfOrCnpj", () => {
		it("aceita CPF válido com máscara", () => {
			expect(isValidCpfOrCnpj("529.982.247-25")).toBe(true);
		});
		it("aceita CNPJ válido sem máscara", () => {
			expect(isValidCpfOrCnpj("11222333000181")).toBe(true);
		});
		it("aceita CNPJ alfanumérico válido", () => {
			expect(isValidCpfOrCnpj("12ABC34501DE35")).toBe(true);
		});
		it("rejeita string com tamanho diferente de 11/14", () => {
			expect(isValidCpfOrCnpj("12345")).toBe(false);
		});

		it("rejeita CNPJ alfanumérico com dígitos verificadores não-numéricos", () => {
			expect(isValidCnpj("12ABC34501DEXY")).toBe(false);
		});
	});

	describe("onlyDigits", () => {
		it("remove tudo que não for dígito", () => {
			expect(onlyDigits("529.982.247-25")).toBe("52998224725");
			expect(onlyDigits("abc 123 def")).toBe("123");
		});

		it("retorna string vazia para null/undefined", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(onlyDigits(null as any)).toBe("");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(onlyDigits(undefined as any)).toBe("");
		});
	});

	describe("normalizeCpfOrCnpj", () => {
		it("remove máscara e preserva letras no CNPJ", () => {
			expect(normalizeCpfOrCnpj("12.ABC.345/01de-35")).toBe("12ABC34501DE35");
		});

		it("retorna string vazia para null/undefined", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(normalizeCpfOrCnpj(null as any)).toBe("");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(normalizeCpfOrCnpj(undefined as any)).toBe("");
		});
	});

	describe("IsCpfOrCnpjConstraint", () => {
		it("validate retorna true para CPF válido", () => {
			const { IsCpfOrCnpjConstraint } = require("./cpf-cnpj.validator");
			const constraint = new IsCpfOrCnpjConstraint();
			expect(constraint.validate("529.982.247-25")).toBe(true);
		});

		it("validate retorna false para valor não-string", () => {
			const { IsCpfOrCnpjConstraint } = require("./cpf-cnpj.validator");
			const constraint = new IsCpfOrCnpjConstraint();
			expect(constraint.validate(12345678901)).toBe(false);
			expect(constraint.validate(null)).toBe(false);
			expect(constraint.validate(undefined)).toBe(false);
		});

		it("defaultMessage retorna mensagem de erro", () => {
			const { IsCpfOrCnpjConstraint } = require("./cpf-cnpj.validator");
			const constraint = new IsCpfOrCnpjConstraint();
			expect(constraint.defaultMessage()).toContain("CPF ou CNPJ");
		});
	});
});
