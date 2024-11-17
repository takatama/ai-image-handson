const promptInput = document.getElementById("prompt");
const translatedPrompt = document.getElementById("translated-prompt");
const translateBtn = document.getElementById("translate-btn");
const generateBtn = document.getElementById("generate-btn");
const translateSpinner = document.getElementById("translate-spinner");
const generateSpinner = document.getElementById("generate-spinner");
const img = document.getElementById("generated-image");
const translateErrorMessage = document.getElementById(
  "translate-error-message"
);
const generateErrorMessage = document.getElementById("generate-error-message");

translateBtn.addEventListener("click", translateText);
generateBtn.addEventListener("click", generateImage);

async function handleTurnstileResponse(token) {
  const formData = new FormData();
  formData.set("cf-turnstile-response", token);
  const response = await fetch("/auth", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("認証に失敗しました");
  }
  translateBtn.disabled = false;
  generateBtn.disabled = false;
}

function initializeTurnstile() {
  turnstile.render("#turnstile-widget", {
    // 自分で作成したTurnstileのSite Keyを記入してください
    sitekey: "0x4AAAAAAAzs018lIIK5s9-R",
    callback: handleTurnstileResponse,
    "expired-callback": resetToTurnstile,
  });
}

function resetToTurnstile() {
  translateBtn.disabled = true;
  generateBtn.disabled = true;
  isAuthenticated = false;
  turnstile.reset();
}

function toggleButton(button, spinner, isLoading) {
  button.disabled = isLoading;
  spinner.style.display = isLoading ? "block" : "none";
}

async function handleEventStream(response, textarea) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    chunk.split("\n").forEach((line) => {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") return;
        try {
          const jsonData = JSON.parse(data);
          text += jsonData.response;
          textarea.value = text;
          textarea.scrollTop = textarea.scrollHeight;
        } catch (error) {
          // JSONデータが壊れている場合は無視する
        }
      }
    });
  }
}

async function translateText() {
  translateErrorMessage.style.display = "none";
  toggleButton(translateBtn, translateSpinner, true);

  try {
    const formData = new FormData();
    formData.set("prompt", promptInput.value);
    const response = await fetch(`/translate`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        translateErrorMessage.textContent =
          "セッションの有効期限が切れました。もう一度試してください。";
        translateErrorMessage.style.display = "block";
        resetToTurnstile();
      } else {
        const errorData = await response.json();
        throw new Error("エラー:", errorData.error);
      }
    }
    await handleEventStream(response, translatedPrompt);
  } catch (error) {
    console.error("エラー: ", error);
    translateErrorMessage.textContent =
      "翻訳に失敗しました。もう一度試してください。";
    translateErrorMessage.style.display = "block";
  } finally {
    toggleButton(translateBtn, translateSpinner, false);
  }
}

async function generateImage() {
  toggleButton(generateBtn, generateSpinner, true);
  img.style.display = "none";
  generateErrorMessage.style.display = "none";

  try {
    const formData = new FormData();
    formData.set("prompt", translatedPrompt.value);

    const response = await fetch(`/generate-image`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        generateErrorMessage.textContent =
          "セッションの有効期限が切れました。もう一度試してください。";
        generateErrorMessage.style.display = "block";
        resetToTurnstile();
      } else {
        throw new Error("画像生成エラー");
      }
    }

    const data = await response.json();
    if (data.imageUrl) {
      img.src = data.imageUrl;
      img.style.display = "block";
    } else {
      throw new Error("画像データが取得できませんでした。");
    }
  } catch (error) {
    console.error("エラー: ", error);
    generateErrorMessage.textContent =
      "画像生成に失敗しました。もう一度試すか、プロンプトを変えてください。";
    generateErrorMessage.style.display = "block";
  } finally {
    toggleButton(generateBtn, generateSpinner, false);
  }
}
