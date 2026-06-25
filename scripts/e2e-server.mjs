import { spawn } from "node:child_process";
import { PGliteServer, pushMigrations, hasSchema } from "prisma-pglite-bridge";

const PORT = Number(process.env.PGLITE_PORT ?? 5432);
const HOST = process.env.PGLITE_HOST ?? "127.0.0.1";

const server = new PGliteServer({ host: HOST, port: PORT });
const url = await server.listen();
console.log(`[e2e-server] PGlite listening on ${url}`);

try {
  const already = await hasSchema(server.pglite);
  if (already) {
    console.log("[e2e-server] Schema already present, skipping migrations");
  } else {
    const result = await pushMigrations(server.pglite, {
      migrationsPath: "./prisma/migrations",
    });
    console.log(`[e2e-server] Applied migrations in ${result.durationMs}ms`);
  }
} catch (err) {
  console.error("[e2e-server] Migration failed:", err);
  await server.close();
  process.exit(1);
}

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    DATABASE_URL: `postgresql://e2e:e2e@${HOST}:${PORT}/e2e?schema=public`,
  },
});

let exiting = false;
const shutdown = async (code) => {
  if (exiting) return;
  exiting = true;
  try {
    child.kill();
  } catch {
  }
  try {
    await server.close();
  } catch {
  }
  process.exit(typeof code === "number" ? code : 0);
};

child.on("exit", (code) => shutdown(code ?? 0));
process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
