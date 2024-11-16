import turnstilePlugin from "@cloudflare/pages-plugin-turnstile";
import { createSignedCookie } from "../utils/session";

// 1. Turnstile認証とセッションCookieの払い出しAPI
export const onRequestPost = [
  async (context) => {
    return turnstilePlugin({
      secret: context.env.TRUNSTILE_SECRET_KEY,
    })(context);
  },
  async ({ request, env }) => {
    const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET);
    const response = new Response("Authenticated", { status: 200 });
    response.headers.set(
      "Set-Cookie",
      await createSignedCookie({ authenticated: true }, sessionSecret)
    );
    return response;
  },
];
