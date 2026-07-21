// 특수 효과 상태 변수
let isBlurred = false;
let isMosaiced = false;
let isRotated = false;

// 팝업으로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "toggle-blur":
      isBlurred = !isBlurred;
      document.body.style.filter = isBlurred ? "blur(6px)" : "none";
      break;

    case "toggle-mosaic":
      isMosaiced = !isMosaiced;
      if (isMosaiced) {
        applyMosaicEffect();
      } else {
        removeMosaicEffect();
      }
      break;

    case "toggle-rotate":
      isRotated = !isRotated;
      document.body.style.transform = isRotated ? "rotate(180deg)" : "none";
      document.body.style.transition = "transform 0.5s ease-in-out";
      break;
  }
});

// CSS 픽셀화(모자이크) 구현
function applyMosaicEffect() {
  let styleEl = document.getElementById("ext-mosaic-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "ext-mosaic-style";
    styleEl.innerHTML = `
      img, video, canvas {
        filter: contrast(200%) blur(10px) !important;
        image-rendering: pixelated !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

function removeMosaicEffect() {
  const styleEl = document.getElementById("ext-mosaic-style");
  if (styleEl) styleEl.remove();
}
