import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { setupApp } from "./helpers/app-factory";
import { truncateAll } from "./helpers/db";

describe("App (e2e) — healthcheck público", () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		app = await setupApp();
		prisma = app.get(PrismaService);
		await truncateAll(prisma);
	});

	afterAll(async () => {
		await app.close();
	});

	it("GET / retorna 200 sem token (rota pública)", async () => {
		const res = await request(app.getHttpServer()).get("/");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 200, success: true, data: "API Online!" });
	});
});
