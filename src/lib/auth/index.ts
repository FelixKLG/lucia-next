import { Lucia } from "lucia";
import type { Session, User } from "lucia";
import { db } from "@/lib/db/drizzle";
import { session } from "@/lib/db/session";
import { user } from "@/lib/db/user";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Discord } from "arctic";
import { cache } from "react";
import { cookies } from "next/headers";

export const discord = new Discord(
    // biome-ignore lint/style/noNonNullAssertion: non-null assertions are good for environment variables
    process.env.DISCORD_CLIENT_ID!,
    // biome-ignore lint/style/noNonNullAssertion: non-null assertions are good for environment variables
    process.env.DISCORD_CLIENT_SECRET!,
    "http://localhost:3000/login/callback",
);

const adapter = new DrizzlePostgreSQLAdapter(db, session, user); // your adapter

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: process.env.NODE_ENV === "production",
        },
    },
    getUserAttributes: attributes => {
        return {
            // attributes has the type of DatabaseUserAttributes
            discordId: attributes.discord_id,
            username: attributes.username,
        };
    },
});

// IMPORTANT!
declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}

interface DatabaseUserAttributes {
    discord_id: number;
    username: string;
}

export const validateRequest = cache(
    async (): Promise<
        { user: User; session: Session } | { user: null; session: null }
    > => {
        const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
        if (!sessionId) {
            return {
                user: null,
                session: null,
            };
        }

        const result = await lucia.validateSession(sessionId);
        // next.js throws when you attempt to set cookie when rendering page
        try {
            if (result.session?.fresh) {
                const sessionCookie = lucia.createSessionCookie(
                    result.session.id,
                );
                cookies().set(
                    sessionCookie.name,
                    sessionCookie.value,
                    sessionCookie.attributes,
                );
            }
            if (!result.session) {
                const sessionCookie = lucia.createBlankSessionCookie();
                cookies().set(
                    sessionCookie.name,
                    sessionCookie.value,
                    sessionCookie.attributes,
                );
            }
        } catch {}
        return result;
    },
);
