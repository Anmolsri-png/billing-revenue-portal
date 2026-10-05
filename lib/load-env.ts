import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { assertSafeDatabaseTarget } from "./database-guard";

function envMode() {
  if (process.env.NODE_ENV === "test") return "test";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

// Same priority as Next.js: the first file that defines a variable wins,
// and a variable already injected by the host is never replaced.
const mode = envMode();
const files = [
  `.env.${mode}.local`,
  mode !== "test" ? ".env.local" : "",
  `.env.${mode}`,
  ".env",
].filter(Boolean);

const fromFiles: Record<string, string> = {};

for (const file of files) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;

  for (const [key, value] of Object.entries(parse(readFileSync(path)))) {
    if (fromFiles[key] === undefined) fromFiles[key] = value;
  }
}

for (const [key, value] of Object.entries(fromFiles)) {
  if (process.env[key] === undefined || process.env[key] === "") {
    process.env[key] = value;
  }
}

assertSafeDatabaseTarget(process.env.DATABASE_URL);
