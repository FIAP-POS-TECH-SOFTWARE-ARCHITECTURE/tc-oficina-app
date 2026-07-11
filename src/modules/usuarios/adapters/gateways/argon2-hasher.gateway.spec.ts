import { Argon2HasherGateway } from "./argon2-hasher.gateway";

describe("Argon2HasherGateway", () => {
	const gateway = new Argon2HasherGateway();

	it("gera hash argon2 verificável", async () => {
		const hash = await gateway.hash("senha-secreta");
		expect(hash).toContain("$argon2");
		expect(await gateway.verificar(hash, "senha-secreta")).toBe(true);
	});

	it("verificar retorna false para senha errada", async () => {
		const hash = await gateway.hash("senha-secreta");
		expect(await gateway.verificar(hash, "outra-senha")).toBe(false);
	});
});
