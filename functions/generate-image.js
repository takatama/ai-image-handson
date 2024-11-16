import { validateSessionCookie } from "../utils/session.js";

export async function onRequestPost({ request, env }) {
  const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET);

  // セッションCookieの検証
  const isValidSession = await validateSessionCookie(request, sessionSecret);
  if (!isValidSession) {
    console.error("認証エラー: 無効なセッションCookie");
    return new Response("Unauthorized", { status: 401 });
  }

  // Origin検証
  const allowedOrigin = env.ALLOWED_ORIGIN;
  const origin = request.headers.get("Origin");
  if (allowedOrigin !== origin) {
    console.error(
      `許可されていないOriginです。origin=${origin}, allowedOrigin=${allowedOrigin}`
    );
    return new Response("Forbidden", { status: 403 });
  }

  // 画像生成の処理
  const formData = await request.formData();
  const prompt = formData.get("prompt");
  return await generateImage(prompt, env);
}

async function generateImage(prompt, env) {
  const inputs = { prompt };

  try {
    const response = await env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      inputs
    );
    const imageUrl = `data:image/jpeg;base64,${response.image}`;
    return new Response(JSON.stringify({ imageUrl }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("画像生成エラー:", error);
    return new Response(JSON.stringify({ error: "画像生成に失敗しました。" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
