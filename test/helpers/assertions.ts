import type { Response } from "supertest";

export function expectStatus(res: Response, status: number): void {
	if (res.status !== status) {
		throw new Error(
			`Esperado status ${status} mas recebeu ${res.status}. Body: ${JSON.stringify(res.body)}`,
		);
	}
}

export function expectSuccess<T = any>(res: Response, status = 200): T {
	expect(res.status).toBe(status);
	expect(res.body.success).toBe(true);
	expect(res.body.status).toBe(status);
	return res.body.data as T;
}

export function expectError(res: Response, status: number): any {
	expect(res.status).toBe(status);
	expect(res.body.success).toBe(false);
	return res.body.error ?? res.body;
}
