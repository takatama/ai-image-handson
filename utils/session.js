import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 360, // Turnstileの有効期限（5分）より、少しだけ長くする（6分）
  path: "/",
};

// ユーティリティ関数
export async function createSignedCookie(value, sessionSecret) {
  const token = await new SignJWT(value)
    .setProtectedHeader({ alg: "HS256" })
    // Turnstileの有効期限（5分）より、少しだけ長くする（6分）
    .setExpirationTime("6m")
    .sign(sessionSecret);

  const cookieAttributes = [
    `Path=${COOKIE_OPTIONS.path}`,
    `HttpOnly=${COOKIE_OPTIONS.httpOnly ? "true" : ""}`,
    `Secure=${COOKIE_OPTIONS.secure ? "true" : ""}`,
    `SameSite=${COOKIE_OPTIONS.sameSite}`,
    `Max-Age=${COOKIE_OPTIONS.maxAge}`,
  ]
    .filter(Boolean) // 無効なプロパティを削除
    .join("; ");

  return `${COOKIE_NAME}=${token}; ${cookieAttributes}`;
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

export async function verifySession(context) {
  const { request, env } = context;
  const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET);

  const isValidSession = await validateSessionCookie(request, sessionSecret);
  if (!isValidSession) {
    console.error("認証エラー: 無効なセッションCookie");
    return new Response("Unauthorized", { status: 401 });
  }
  return context.next();
}
