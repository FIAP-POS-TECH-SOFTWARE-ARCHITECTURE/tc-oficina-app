import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

const PLACA_ANTIGA_REGEX = /^[A-Z]{3}[0-9]{4}$/;
const PLACA_MERCOSUL_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizarPlaca(placa: string): string {
	return (placa ?? "").replace(/[\s-]/g, "").toUpperCase();
}

export function isValidPlaca(placa: string): boolean {
	if (typeof placa !== "string") return false;
	const value = normalizarPlaca(placa);
	return PLACA_ANTIGA_REGEX.test(value) || PLACA_MERCOSUL_REGEX.test(value);
}

@ValidatorConstraint({ name: "IsPlacaVeiculo", async: false })
export class IsPlacaVeiculoConstraint implements ValidatorConstraintInterface {
	validate(value: unknown): boolean {
		if (typeof value !== "string") return false;
		return isValidPlaca(value);
	}

	defaultMessage(): string {
		return "Placa inválida. Use o padrão antigo (AAA-9999/AAA9999) ou Mercosul (AAA9A99).";
	}
}

export function IsPlacaVeiculo(options?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options,
			constraints: [],
			validator: IsPlacaVeiculoConstraint,
		});
	};
}
