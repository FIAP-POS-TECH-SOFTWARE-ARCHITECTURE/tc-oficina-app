export const SENHA_HASHER = Symbol("SENHA_HASHER");

export interface SenhaHasherPort {
	hash(senha: string): Promise<string>;
	verificar(hash: string, senha: string): Promise<boolean>;
}
