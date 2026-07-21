const SERVER_URL = "https://your-render-app.onrender.com"; // Render 배포 URL로 변경

document.addEventListener("DOMContentLoaded", async () => {
  const { token } = await chrome.storage.local.get("token");
  if (token) showMain();

  document.getElementById("btn-login").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${SERVER_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.token) {
      await chrome.storage.local.set({ token: data.token });
      showMain();
    } else {
      alert(data.error || "로그인 실패");
    }
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await chrome.storage.local.remove("token");
    location.reload();
  });

  // 화면 효과 명령 전송
  document
    .getElementById("btn-blur")
    .addEventListener("click", () => sendEffect("blur"));
  document
    .getElementById("btn-rotate")
    .addEventListener("click", () => sendEffect("rotate"));
});

function showMain() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("main-section").classList.remove("hidden");
}

async function sendEffect(action) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action });
}
