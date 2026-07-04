import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { config } from "dotenv";
import { execSync } from "node:child_process";
import path from "node:path";
import { setContainer, writeDatabaseUrl } from "./helpers/db-container-state";

export default async function globalSetup(): Promise<void> {
	config({ path: path.resolve(__dirname, "..", ".env.test") });

	const container = await new PostgreSqlContainer("postgres:18-alpine")
		.withDatabase("oficina_test")
		.withUsername("postgres")
		.withPassword("password")
		.start();

	setContainer(container);

	const databaseUrl = `${container.getConnectionUri()}?schema=public`;
	writeDatabaseUrl(databaseUrl);

	try {
		execSync("npx prisma migrate deploy", {
			stdio: "inherit",
			env: { ...process.env, DATABASE_URL: databaseUrl },
			cwd: path.resolve(__dirname, ".."),
		});
	} catch (error) {
		await container.stop();
		throw error;
	}
}
