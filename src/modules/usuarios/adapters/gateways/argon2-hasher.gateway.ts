import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { SenhaHasherPort } from "../../application/ports/senha-hasher.gateway";

@Injectable()
export class Argon2HasherGateway implements SenhaHasherPort {
	hash(senha: string): Promise<string> {
		return argon2.hash(senha);
	}

	verificar(hash: string, senha: string): Promise<boolean> {
		return argon2.verify(hash, senha);
	}
}
