import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as user from "./user";
import * as session from "./session";

const pool = new Pool({
    // biome-ignore lint/style/noNonNullAssertion: non-null assertions are good for environment variables
    connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(await pool.connect(), {
    schema: { ...user, ...session },
});
