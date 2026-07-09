import { IS_PUBLIC_KEY } from "../../../common/decorators/public.decorator";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
	const loginUseCase = { execute: jest.fn() };
	let controller: AuthController;

	beforeEach(() => {
		jest.clearAllMocks();
		controller = new AuthController(loginUseCase as any);
	});

	it("login delega ao use case e retorna o resultado", async () => {
		loginUseCase.execute.mockResolvedValueOnce({ status: 200 });
		const r = await controller.login({ email: "a@a", senha: "x" });
		expect(loginUseCase.execute).toHaveBeenCalledWith({ email: "a@a", senha: "x" });
		expect(r.status).toBe(200);
	});

	it("método login está marcado como @Public()", () => {
		expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.login)).toBe(true);
	});
});
