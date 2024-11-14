export async function onRequestPost({ request, env }) {
  const allowedOrigin = env.ALLOWED_ORIGIN;
  const origin = request.headers.get("Origin");
  if (allowedOrigin !== origin) {
    console.error(
      `許可されていないOriginです。origin=${origin}, allowedOrigin=${allowedOrigin}`
    );
    return new Response("Forbidden", { status: 403 });
  }
  const formData = await request.formData();
  const prompt = formData.get("prompt");
  return await translatePrompt(prompt, env);
}

async function translatePrompt(prompt, env) {
  const messages = [
    {
      role: "system",
      content: `
Translate the following Japanese text into a detailed English prompt for image generation,
including all subjects, actions, and style details.
Output only the prompt.`,
    },
    { role: "user", content: prompt },
  ];

  try {
    const stream = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
      messages,
      stream: true,
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("翻訳エラー:", error);
    return new Response(JSON.stringify({ error: "翻訳に失敗しました。" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
