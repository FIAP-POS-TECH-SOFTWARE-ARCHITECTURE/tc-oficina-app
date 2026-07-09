import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TokenPort } from "../../application/ports/token.gateway";

@Injectable()
export class JwtTokenGateway implements TokenPort {
	constructor(private readonly jwt: JwtService) {}

	gerarToken(payload: Record<string, unknown>): Promise<string> {
		return this.jwt.signAsync(payload);
	}
}
