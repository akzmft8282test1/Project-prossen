// 백엔드 주소 (로컬 테스트 후 Render URL로 변경)
const SERVER_URL = "https://project-prossen.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const { token } = await chrome.storage.local.get("token");
  if (token) showMainSection();

  // 탭 전환 이벤트
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabSignupBtn = document.getElementById("tab-signup-btn");
  const formLogin = document.getElementById("form-login");
  const formSignup = document.getElementById("form-signup");

  tabLoginBtn.addEventListener("click", () => {
    tabLoginBtn.classList.add("active");
    tabSignupBtn.classList.remove("active");
    formLogin.classList.remove("hidden");
    formSignup.classList.add("hidden");
  });

  tabSignupBtn.addEventListener("click", () => {
    tabSignupBtn.classList.add("active");
    tabLoginBtn.classList.remove("active");
    formSignup.classList.remove("hidden");
    formLogin.classList.add("hidden");
  });

  // 회원가입
  document.getElementById("btn-signup").addEventListener("click", async () => {
    const nickname = document.getElementById("signup-nickname").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const res = await fetch(`${SERVER_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nickname }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("회원가입이 완료되었습니다! 로그인해 주세요.");
      tabLoginBtn.click();
    } else {
      alert(data.error || "회원가입 실패");
    }
  });

  // 로그인
  document.getElementById("btn-login").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const res = await fetch(`${SERVER_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.token) {
      await chrome.storage.local.set({ token: data.token });
      showMainSection();
    } else {
      alert(data.error || "로그인 실패");
    }
  });

  // 로그아웃
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await chrome.storage.local.remove("token");
    location.reload();
  });

  // 화면 효과 명령 전달
  document
    .getElementById("btn-blur")
    .addEventListener("click", () => sendEffectToContent("toggle-blur"));
  document
    .getElementById("btn-mosaic")
    .addEventListener("click", () => sendEffectToContent("toggle-mosaic"));
  document
    .getElementById("btn-rotate")
    .addEventListener("click", () => sendEffectToContent("toggle-rotate"));
});

async function showMainSection() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("main-section").classList.remove("hidden");

  // 현재 활성 탭 URL 표시
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    document.getElementById("url-info").innerText = tab.url;
  }
}

async function sendEffectToContent(action) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action });
  }
}
