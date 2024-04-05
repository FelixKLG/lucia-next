#!/usr/bin/env bun

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import path from "node:path";

(async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(client);

    const migrationsFolder = path.join(__dirname, "../drizzle");

    await migrate(db, {
        migrationsFolder,
        migrationsTable: "drizzle_migrations",
    });
})();
