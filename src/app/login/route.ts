import { discord } from "@/lib/auth";
import { generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
    const state = generateState();
    const url = discord.createAuthorizationURL(state, {
        scopes: ["identify"],
    });

    cookies().set("discord_oauth_csrf", state, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax",
    });

    return Response.redirect(await url);
}
