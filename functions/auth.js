import turnstilePlugin from "@cloudflare/pages-plugin-turnstile";
import { createSignedCookie } from "../utils/session";
import { verifyOrigin } from "../utils/origin.js";

export const onRequestPost = [
  verifyOrigin,
  // Turnstile認証
  async (context) => {
    return turnstilePlugin({
      secret: context.env.TRUNSTILE_SECRET_KEY,
    })(context);
  },
  async ({ request, env }) => {
    const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET);
    const response = new Response("Authenticated", { status: 200 });
    // セッションCookieの払い出し
    response.headers.set(
      "Set-Cookie",
      await createSignedCookie({ authenticated: true }, sessionSecret)
    );
    // JWTがレスポンスに含まれるためキャッシュさせない
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  },
];
