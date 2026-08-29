import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { AuthenticatedCliente } from "../decorators/current-cliente.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { IS_CLIENTE_AUTH_KEY } from "../decorators/cliente-auth.decorator";
import { PrismaService } from "../../prisma/prisma.service";

interface JwtPayload {
	sub: string;
	email?: string;
	role?: string;
	type?: string;
	cpf?: string;
	nome?: string;
}

type RequestWithUser = Request & { user?: AuthenticatedUser; cliente?: AuthenticatedCliente };

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly jwt: JwtService,
		private readonly reflector: Reflector,
		private readonly prisma: PrismaService,
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
		if (isPublic) return true;

		const isClienteAuth = this.reflector.getAllAndOverride<boolean>(IS_CLIENTE_AUTH_KEY, [ctx.getHandler(), ctx.getClass()]);

		const req = ctx.switchToHttp().getRequest<RequestWithUser>();
		const token = this.extractToken(req);
		if (!token) throw new UnauthorizedException("Token não encontrado");

		try {
			const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
				secret: process.env.JWT_SECRET,
			});

			if (payload.type === "cliente") {
				// Token emitido pela Lambda de autenticação por CPF.
				if (!isClienteAuth) throw new UnauthorizedException("Rota não permitida para clientes");

				const cliente = await this.prisma.cliente.findUnique({
					where: { id: payload.sub },
					select: { ativo: true, nome: true },
				});
				if (!cliente?.ativo) throw new UnauthorizedException("Cliente inativo");

				req.cliente = { id: payload.sub, cpf: payload.cpf ?? "", nome: cliente.nome };
				return true;
			}

			if (isClienteAuth) throw new UnauthorizedException("Rota exclusiva para clientes autenticados por CPF");

			req.user = {
				id: payload.sub,
				email: payload.email ?? "",
				role: payload.role as AuthenticatedUser["role"],
			};
			const usuario = await this.prisma.usuario.findUnique({
				where: { id: payload.sub },
				select: { ativo: true },
			});
			if (!usuario?.ativo) throw new UnauthorizedException("Usuário inativo");

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) throw error;
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
