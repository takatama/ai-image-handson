const translateBtn = document.getElementById("translate-btn");
const generateBtn = document.getElementById("generate-btn");
const translateSpinner = document.getElementById("translate-spinner");
const generateSpinner = document.getElementById("generate-spinner");

translateBtn.addEventListener("click", translateText);
generateBtn.addEventListener("click", generateImage);

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
  const errorMessage = document.getElementById("translate-error-message");
  errorMessage.style.display = "none";
  toggleButton(translateBtn, translateSpinner, true);
  const promptInput = document.getElementById("prompt");

  try {
    const formData = new FormData();
    formData.set("prompt", promptInput.value);
    const response = await fetch(`/translate`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error("エラー:", errorData.error);
    // }
    await verifyResponse(response);

    const translatedPrompt = document.getElementById("translated-prompt");
    await handleEventStream(response, translatedPrompt);
  } catch (error) {
    console.error("エラー: ", error);
    errorMessage.textContent = "翻訳に失敗しました。もう一度試してください。";
    errorMessage.style.display = "block";
  } finally {
    toggleButton(translateBtn, translateSpinner, false);
  }
}

async function generateImage() {
  const errorMessage = document.getElementById("generate-error-message");
  errorMessage.style.display = "none";
  toggleButton(generateBtn, generateSpinner, true);
  const translatedPrompt = document.getElementById("translated-prompt");

  try {
    const formData = new FormData();
    formData.set("prompt", translatedPrompt.value);
    const response = await fetch(`/generate-image`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error("エラー:", errorData.error);
    // }
    await verifyResponse(response);

    const data = await response.json();
    if (data.imageUrl) {
      const img = document.getElementById("generated-image");
      img.src = data.imageUrl;
      img.style.display = "block";
    } else {
      throw new Error("画像データが取得できませんでした。");
    }
  } catch (error) {
    console.error("エラー: ", error);
    errorMessage.textContent =
      "画像生成に失敗しました。もう一度試すか、プロンプトを変えてください。";
    errorMessage.style.display = "block";
  } finally {
    toggleButton(generateBtn, generateSpinner, false);
  }
}
