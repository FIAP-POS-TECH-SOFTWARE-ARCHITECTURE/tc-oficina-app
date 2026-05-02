import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

export function onlyDigits(value: string): string {
	return (value ?? "").replaceAll(/\D/g, "");
}

export function normalizeCpfOrCnpj(value: string): string {
	return (value ?? "").replaceAll(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function isValidCpf(cpf: string): boolean {
	const digits = onlyDigits(cpf);
	if (digits.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(digits)) return false;

	const calc = (factor: number) => {
		let total = 0;
		for (let i = 0; i < factor - 1; i++) {
			total += Number.parseInt(digits[i], 10) * (factor - i);
		}
		const rest = (total * 10) % 11;
		return rest === 10 ? 0 : rest;
	};

	const d1 = calc(10);
	const d2 = calc(11);
	return d1 === Number.parseInt(digits[9], 10) && d2 === Number.parseInt(digits[10], 10);
}

export function isValidCnpj(cnpj: string): boolean {
	const normalized = normalizeCpfOrCnpj(cnpj);
	if (normalized.length !== 14) return false;
	if (!/^[A-Z0-9]{14}$/.test(normalized)) return false;
	if (!/^[A-Z0-9]{12}\d{2}$/.test(normalized)) return false;
	if (/^([A-Z0-9])\1{13}$/.test(normalized)) return false;

	const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

	const getCnpjCharValue = (char: string): number => char.charCodeAt(0) - 48;

	const calc = (weights: number[]) => {
		let total = 0;
		for (let i = 0; i < weights.length; i++) {
			total += getCnpjCharValue(normalized[i]) * weights[i];
		}
		const rest = total % 11;
		return rest < 2 ? 0 : 11 - rest;
	};

	const d1 = calc(weights1);
	const d2 = calc(weights2);
	return d1 === Number.parseInt(normalized[12], 10) && d2 === Number.parseInt(normalized[13], 10);
}

export function isValidCpfOrCnpj(value: string): boolean {
	const normalized = normalizeCpfOrCnpj(value);
	if (normalized.length === 11 && /^\d{11}$/.test(normalized)) return isValidCpf(normalized);
	if (normalized.length === 14) return isValidCnpj(normalized);
	return false;
}

@ValidatorConstraint({ name: "IsCpfOrCnpj", async: false })
export class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
	validate(value: unknown): boolean {
		if (typeof value !== "string") return false;
		return isValidCpfOrCnpj(value);
	}

	defaultMessage(): string {
		return "Documento informado não é um CPF ou CNPJ válido.";
	}
}

export function IsCpfOrCnpj(options?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options,
			constraints: [],
			validator: IsCpfOrCnpjConstraint,
		});
	};
}
