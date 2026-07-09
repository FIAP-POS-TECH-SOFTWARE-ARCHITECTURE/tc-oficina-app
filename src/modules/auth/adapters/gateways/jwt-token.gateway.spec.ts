import { JwtTokenGateway } from "./jwt-token.gateway";

describe("JwtTokenGateway", () => {
	it("delega ao JwtService.signAsync", async () => {
		const jwt = { signAsync: jest.fn().mockResolvedValue("token-abc") };
		const gateway = new JwtTokenGateway(jwt as any);
		const token = await gateway.gerarToken({ sub: "u1", role: "ADMINISTRADOR" });
		expect(token).toBe("token-abc");
		expect(jwt.signAsync).toHaveBeenCalledWith({ sub: "u1", role: "ADMINISTRADOR" });
	});
});
