import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

declare global {
	var __oficinaPgContainer: StartedPostgreSqlContainer | undefined;
}

const STATE_DIR = path.join(os.tmpdir(), "oficina-e2e-testcontainers");
const STATE_FILE = path.join(STATE_DIR, "database-url.txt");

export function writeDatabaseUrl(url: string): void {
	mkdirSync(STATE_DIR, { recursive: true });
	writeFileSync(STATE_FILE, url, "utf-8");
}

export function readDatabaseUrl(): string {
	return readFileSync(STATE_FILE, "utf-8").trim();
}

export function setContainer(container: StartedPostgreSqlContainer): void {
	globalThis.__oficinaPgContainer = container;
}

export function getContainer(): StartedPostgreSqlContainer | undefined {
	return globalThis.__oficinaPgContainer;
}
