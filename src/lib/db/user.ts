import { bigint, pgTable, text } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    discordId: bigint("discord_id", { mode: "bigint" }).unique(),
    username: text("username"),
});
