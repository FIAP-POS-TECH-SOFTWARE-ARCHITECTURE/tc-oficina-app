import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

interface JwtPayload {
	sub: string;
	email: string;
	role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly jwt: JwtService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
		if (isPublic) return true;

		const req = ctx.switchToHttp().getRequest<Request>();
		const token = this.extractToken(req);
		if (!token) throw new UnauthorizedException("Token não encontrado");

		try {
			const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
				secret: process.env.JWT_SECRET,
			});

			(req as any).user = {
				id: payload.sub,
				email: payload.email,
				role: payload.role,
			};

			return true;
		} catch {
			throw new UnauthorizedException("Token inválido ou expirado");
		}
	}

	private extractToken(req: Request): string | undefined {
		const auth = req.headers["authorization"];
		if (!auth || typeof auth !== "string") return undefined;

		const [scheme, token] = auth.split(" ");
		if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;

		return token;
	}
}
