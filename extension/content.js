// 웹페이지 내 화면 효과 제어 로직
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "blur") {
    document.body.style.filter =
      document.body.style.filter === "blur(5px)" ? "none" : "blur(5px)";
  } else if (msg.action === "rotate") {
    document.body.style.transform =
      document.body.style.transform === "rotate(180deg)"
        ? "none"
        : "rotate(180deg)";
    document.body.style.transition = "transform 0.5s ease";
  }
});
