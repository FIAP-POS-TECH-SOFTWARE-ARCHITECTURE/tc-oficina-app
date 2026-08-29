import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedCliente {
	id: string;
	cpf: string;
	nome: string;
}

export const CurrentCliente = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedCliente => {
	const req = ctx.switchToHttp().getRequest<{ cliente: AuthenticatedCliente }>();
	return req.cliente;
});
