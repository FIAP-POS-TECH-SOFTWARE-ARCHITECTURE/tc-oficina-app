import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { IS_CLIENTE_AUTH_KEY } from "../decorators/cliente-auth.decorator";

const ctxFor = (req: any): ExecutionContext =>
	({
		getHandler: () => undefined,
		getClass: () => undefined,
		switchToHttp: () => ({ getRequest: () => req }),
	}) as unknown as ExecutionContext;

describe("JwtAuthGuard", () => {
	let jwt: jest.Mocked<JwtService>;
	let reflector: jest.Mocked<Reflector>;
	let prisma: jest.Mocked<PrismaService>;
	let guard: JwtAuthGuard;

	beforeEach(() => {
		jwt = { verifyAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
		reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
		prisma = {
			usuario: { findUnique: jest.fn() },
		} as unknown as jest.Mocked<PrismaService>;
		guard = new JwtAuthGuard(jwt, reflector, prisma);
	});

	it("permite rota pública", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(true);
		const ok = await guard.canActivate(ctxFor({}));
		expect(ok).toBe(true);
	});

	it("401 quando não há header authorization", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		await expect(guard.canActivate(ctxFor({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it("401 quando header não é Bearer", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		await expect(guard.canActivate(ctxFor({ headers: { authorization: "Basic abc" } }))).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it("401 quando authorization não é string", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		await expect(guard.canActivate(ctxFor({ headers: { authorization: ["Bearer", "x"] } }))).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it("401 com mensagem 'Token inválido ou expirado' quando verifyAsync rejeita", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		jwt.verifyAsync.mockRejectedValueOnce(new Error("expired"));
		try {
			await guard.canActivate(ctxFor({ headers: { authorization: "Bearer abc.def.ghi" } }));
			fail("não lançou");
		} catch (err) {
			expect(err).toBeInstanceOf(UnauthorizedException);
			expect((err as Error).message).toBe("Token inválido ou expirado");
		}
	});

	it("200 anexa req.user e retorna true em sucesso", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		jwt.verifyAsync.mockResolvedValueOnce({ sub: "u1", email: "a@a", role: "ADMINISTRADOR" });
		prisma.usuario.findUnique.mockResolvedValueOnce({ ativo: true } as any);
		const req: any = { headers: { authorization: "Bearer xxx" } };
		const ok = await guard.canActivate(ctxFor(req));
		expect(ok).toBe(true);
		expect(req.user).toEqual({ id: "u1", email: "a@a", role: "ADMINISTRADOR" });
	});

	it("401 quando usuário está inativo", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		jwt.verifyAsync.mockResolvedValueOnce({ sub: "u1", email: "a@a", role: "ADMINISTRADOR" });
		prisma.usuario.findUnique.mockResolvedValueOnce({ ativo: false } as any);
		await expect(guard.canActivate(ctxFor({ headers: { authorization: "Bearer xxx" } }))).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it("401 quando usuário não existe no banco (findUnique retorna null)", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		jwt.verifyAsync.mockResolvedValueOnce({ sub: "u1", email: "a@a", role: "ADMINISTRADOR" });
		prisma.usuario.findUnique.mockResolvedValueOnce(null);
		await expect(guard.canActivate(ctxFor({ headers: { authorization: "Bearer xxx" } }))).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it("401 quando header Bearer sem token após espaço", async () => {
		reflector.getAllAndOverride.mockReturnValueOnce(false);
		await expect(guard.canActivate(ctxFor({ headers: { authorization: "Bearer " } }))).rejects.toBeInstanceOf(UnauthorizedException);
	});
});

describe("JwtAuthGuard - tokens de cliente", () => {
	let jwt: JwtService;
	let reflector: { getAllAndOverride: jest.Mock };
	let prisma: { usuario: { findUnique: jest.Mock }; cliente: { findUnique: jest.Mock } };
	let guard: JwtAuthGuard;

	const SEGREDO = "segredo-de-teste";

	// metadados[IS_CLIENTE_AUTH_KEY] = true simula rota @ClienteAuth()
	const contexto = (headers: Record<string, string>, metadados: Record<string, boolean> = {}) => {
		reflector.getAllAndOverride.mockImplementation((key: string) => metadados[key] ?? false);
		const req: Record<string, unknown> = { headers };
		return {
			ctx: {
				getHandler: () => ({}),
				getClass: () => ({}),
				switchToHttp: () => ({ getRequest: () => req }),
			} as never,
			req,
		};
	};

	beforeEach(() => {
		process.env.JWT_SECRET = SEGREDO;
		jwt = new JwtService({ secret: SEGREDO });
		reflector = { getAllAndOverride: jest.fn() };
		prisma = {
			usuario: { findUnique: jest.fn() },
			cliente: { findUnique: jest.fn() },
		};
		guard = new JwtAuthGuard(jwt, reflector as unknown as Reflector, prisma as never);
	});

	it("aceita token de cliente ativo em rota @ClienteAuth e popula req.cliente", async () => {
		prisma.cliente.findUnique.mockResolvedValue({ ativo: true, nome: "Ana Souza" });
		const token = await jwt.signAsync({ sub: "c1", cpf: "12345678909", type: "cliente" });
		const { ctx, req } = contexto({ authorization: `Bearer ${token}` }, { [IS_CLIENTE_AUTH_KEY]: true });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.cliente).toEqual({ id: "c1", cpf: "12345678909", nome: "Ana Souza" });
	});

	it("rejeita token de cliente em rota comum (não @ClienteAuth)", async () => {
		// cliente ativo no banco: se o gate da linha 47 sumisse, cairia no
		// fluxo de cliente e passaria — a mensagem exata discrimina isso.
		prisma.cliente.findUnique.mockResolvedValue({ ativo: true, nome: "Ana" });
		const token = await jwt.signAsync({ sub: "c1", type: "cliente" });
		const { ctx } = contexto({ authorization: `Bearer ${token}` });

		await expect(guard.canActivate(ctx)).rejects.toThrow("Rota não permitida para clientes");
	});

	it("rejeita token de usuário interno em rota @ClienteAuth", async () => {
		// usuário ativo no banco: sem o gate da linha 59, cairia no "Usuário inativo"
		// e o teste passaria à toa; a mensagem exata garante que o gate está no lugar.
		prisma.usuario.findUnique.mockResolvedValue({ ativo: true });
		const token = await jwt.signAsync({ sub: "u1", email: "a@b.c", role: "ADMINISTRADOR" });
		const { ctx } = contexto({ authorization: `Bearer ${token}` }, { [IS_CLIENTE_AUTH_KEY]: true });

		await expect(guard.canActivate(ctx)).rejects.toThrow("Rota exclusiva para clientes autenticados por CPF");
	});

	it("rejeita token de cliente inativo", async () => {
		prisma.cliente.findUnique.mockResolvedValue({ ativo: false, nome: "Ana" });
		const token = await jwt.signAsync({ sub: "c1", type: "cliente" });
		const { ctx } = contexto({ authorization: `Bearer ${token}` }, { [IS_CLIENTE_AUTH_KEY]: true });

		await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
	});

	it("regressão: rota @Public segue passando sem token", async () => {
		const { ctx } = contexto({}, { [IS_PUBLIC_KEY]: true });
		await expect(guard.canActivate(ctx)).resolves.toBe(true);
	});
});
