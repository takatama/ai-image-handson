import turnstilePlugin from "@cloudflare/pages-plugin-turnstile";

export const onRequestPost = [
  async (context) => {
    return turnstilePlugin({
      secret: context.env.TRUNSTILE_SECRET_KEY,
    })(context);
  },
  async ({ request, env }) => {
    const formData = await request.formData();
    const prompt = formData.get("prompt");
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
