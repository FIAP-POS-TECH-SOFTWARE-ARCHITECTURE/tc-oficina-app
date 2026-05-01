import { INestApplication } from "@nestjs/common";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";

export interface AuthFixture {
	token: string;
	user: { id: string; email: string; role: Role };
}

export async function loginAs(app: INestApplication, prisma: PrismaService, role: Role): Promise<AuthFixture> {
	const senha = "Senha12345!";
	const email = `${role.toLowerCase()}-${randomUUID()}@e2e.test`;
	const senhaHash = await argon2.hash(senha);

	const u = await prisma.usuario.create({
		data: { nome: `Usuario ${role}`, email, senhaHash, role, ativo: true },
	});

	const res = await request(app.getHttpServer()).post("/auth/login").send({ email, senha });
	if (res.status !== 200) {
		throw new Error(`Falha no login do role ${role}: status=${res.status} body=${JSON.stringify(res.body)}`);
	}

	return {
		token: res.body.data.accessToken as string,
		user: { id: u.id, email, role },
	};
}

export function bearer(token: string): string {
	return `Bearer ${token}`;
}
