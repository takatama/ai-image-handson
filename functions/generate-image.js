import { verifySession } from "../utils/session.js";
import { verifyOrigin } from "../utils/origin.js";
import { sanitize } from "../utils/sanitize.js";

export const onRequestPost = [verifySession, verifyOrigin, handleGenerateImage];

async function handleGenerateImage({ request, env }) {
  const formData = await request.formData();
  const prompt = sanitize(formData.get("prompt") || "");
  const width = formData.get("width") || "512";
  const height = formData.get("height") || "512";
  const model = formData.get("model") || "@cf/black-forest-labs/flux-2-dev";

  const allowedModels = new Set([
    "@cf/black-forest-labs/flux-2-dev",
    "@cf/black-forest-labs/flux-2-klein-4b",
    "@cf/black-forest-labs/flux-1-schnell",
  ]);

  const selectedModel = allowedModels.has(model)
    ? model
    : "@cf/black-forest-labs/flux-2-dev";

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "プロンプトを入力してください。" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return await generateImage(
    { prompt, width, height, model: selectedModel },
    env
  );
}

async function generateImage({ prompt, width, height, model }, env) {
  try {
    const response =
      model === "@cf/black-forest-labs/flux-1-schnell"
        ? await env.AI.run(model, { prompt })
        : await runFlux2({ prompt, width, height, env, model });
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

async function runFlux2({ prompt, width, height, env, model }) {
  const form = new FormData();
  form.set("prompt", prompt);
  form.set("width", String(width));
  form.set("height", String(height));

  const formRequest = new Request("http://dummy", {
    method: "POST",
    body: form,
  });

  const multipart = {
    body: formRequest.body,
    contentType:
      formRequest.headers.get("content-type") || "multipart/form-data",
  };

  return await env.AI.run(model, { multipart });
}
