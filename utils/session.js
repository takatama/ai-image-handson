import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 3600, // 有効期限は1時間（秒）
};

// ユーティリティ関数
export async function createSignedCookie(value, sessionSecret) {
  const token = await new SignJWT(value)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(sessionSecret);

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_OPTIONS.maxAge}`;
}

export async function validateSessionCookie(request, sessionSecret) {
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
