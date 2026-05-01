import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
	let service: jest.Mocked<AuthService>;
	let controller: AuthController;

	beforeEach(() => {
		service = { login: jest.fn() } as unknown as jest.Mocked<AuthService>;
		controller = new AuthController(service);
	});

	it("login delega ao service e retorna o resultado", async () => {
		service.login.mockResolvedValueOnce({ status: 200 } as any);
		const r = await controller.login({ email: "a@a", senha: "x" });
		expect(service.login).toHaveBeenCalledWith({ email: "a@a", senha: "x" });
		expect(r.status).toBe(200);
	});

	it("método login está marcado como @Public()", () => {
		expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.login)).toBe(true);
	});
});
