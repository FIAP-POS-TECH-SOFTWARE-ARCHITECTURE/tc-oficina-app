export const TOKEN = Symbol("TOKEN");

export interface TokenPort {
	gerarToken(payload: Record<string, unknown>): Promise<string>;
}
