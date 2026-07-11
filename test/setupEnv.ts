import { config } from "dotenv";
import path from "node:path";
import { readDatabaseUrl } from "./helpers/db-container-state";

config({ path: path.resolve(__dirname, "..", ".env.test") });

process.env.DATABASE_URL = readDatabaseUrl();
