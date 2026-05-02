import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";

const ctxFor = (req: any): ExecutionContext =>
	({
		getHandler: () => undefined,
		getClass: () => undefined,
		switchToHttp: () => ({ getRequest: () => req }),
	}) as unknown as ExecutionContext;

describe("JwtAuthGuard", () => {
	let jwt: jest.Mocked<JwtService>;
	let reflector: jest.Mocked<Reflector>;
	let guard: JwtAuthGuard;

	beforeEach(() => {
		jwt = { verifyAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
		reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
		guard = new JwtAuthGuard(jwt, reflector);
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
		const req: any = { headers: { authorization: "Bearer xxx" } };
		const ok = await guard.canActivate(ctxFor(req));
		expect(ok).toBe(true);
		expect(req.user).toEqual({ id: "u1", email: "a@a", role: "ADMINISTRADOR" });
	});
});
