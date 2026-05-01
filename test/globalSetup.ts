import { config } from "dotenv";
import { execSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup(): Promise<void> {
	config({ path: path.resolve(__dirname, "..", ".env.test") });

	execSync("npx prisma migrate deploy", {
		stdio: "inherit",
		env: process.env,
		cwd: path.resolve(__dirname, ".."),
	});
}
