import { gerarNumeroOs, NUMERO_OS_REGEX } from "./numero-os";

describe("numero-os", () => {
	it("gera número no formato OS-<ano>-<seq 6 dígitos>", () => {
		expect(gerarNumeroOs(2026, 42)).toBe("OS-2026-000042");
	});

	it("regex valida o formato", () => {
		expect(NUMERO_OS_REGEX.test("OS-2026-000042")).toBe(true);
		expect(NUMERO_OS_REGEX.test("OS-26-42")).toBe(false);
		expect(NUMERO_OS_REGEX.test("123")).toBe(false);
	});
});
