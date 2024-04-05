import { discord, lucia } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { user } from "@/lib/db/user";
import { httpClient } from "@/lib/discord";
import { createId } from "@paralleldrive/cuid2";
import { OAuth2RequestError } from "arctic";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    const url = new URL(req.url);

    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");

    const storedState = cookies().get("discord_oauth_csrf")?.value ?? null;

    if (!code || !state || !storedState || state !== storedState) {
        return new Response(null, {
            status: 400,
        });
    }

    try {
        const tokens = await discord.validateAuthorizationCode(code);

        const userInfo = await httpClient.get<DiscordUser>("/users/@me", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        });

        const existingUser = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.discordId, userInfo.data.id),
        });

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            cookies().set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes,
            );
            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/",
                },
            });
        }

        const userId = createId();

        await db.insert(user).values({
            id: userId,
            discordId: userInfo.data.id,
            username: userInfo.data.username,
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
            },
        });
    } catch (e) {
        if (e instanceof OAuth2RequestError) {
            // invalid code
            return new Response(null, {
                status: 400,
            });
        }

        console.log(e);

        return new Response(null, {
            status: 500,
        });
    }
}

interface DiscordUser {
    id: bigint;
    username: string;
    avatar: string;
    discriminator: number;
}
