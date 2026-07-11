export const NUMERO_OS_REGEX = /^OS-\d{4}-\d{6}$/;

export function gerarNumeroOs(ano: number, sequencial: number): string {
	return `OS-${ano}-${String(sequencial).padStart(6, "0")}`;
}
