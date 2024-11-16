import turnstilePlugin from "@cloudflare/pages-plugin-turnstile";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 3600, // 有効期限は1時間（秒）
};

// ユーティリティ関数
async function createSignedCookie(value, sessionSecret) {
  const token = await new SignJWT(value)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(sessionSecret);

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_OPTIONS.maxAge}`;
}

async function validateSessionCookie(request, sessionSecret) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return false;

  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const token = match[1];
  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

// 1. Turnstile認証とセッションCookieの払い出しAPI
export const onRequestPost = [
  async (context) => {
    return turnstilePlugin({
      secret: context.env.TRUNSTILE_SECRET_KEY,
    })(context);
  },
  async ({ request, env }) => {
    console.log("OK");
    const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET);
    const response = new Response("Authenticated", { status: 200 });
    response.headers.set(
      "Set-Cookie",
      await createSignedCookie({ authenticated: true }, sessionSecret)
    );
    return response;
  },
];
