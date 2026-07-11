const PLACA_ANTIGA_REGEX = /^[A-Z]{3}[0-9]{4}$/;
const PLACA_MERCOSUL_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function placaValida(placa: string): boolean {
	if (typeof placa !== "string") return false;
	const value = placa.replaceAll(/[\s-]/g, "").toUpperCase();
	return PLACA_ANTIGA_REGEX.test(value) || PLACA_MERCOSUL_REGEX.test(value);
}
