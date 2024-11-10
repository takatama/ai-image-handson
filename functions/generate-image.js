import turnstilePlugin from "@cloudflare/pages-plugin-turnstile";

const onRequestGet = [
  async (context) => {
    return turnstilePlugin({
      secret: context.env.TRUNSTILE_SECRET_KEYSECRET_KEY,
    })(context);
  },
  async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const prompt = url.searchParams.get("prompt") || "かわいい猫のイラスト";
    return await generateImage(prompt, env);
  },
];

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
