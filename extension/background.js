let redirectChains = {};

// 리다이렉트 발생 시 체인 기록
chrome.webNavigation.onBeforeRedirect.addListener((details) => {
  if (details.frameId === 0) {
    if (!redirectChains[details.tabId]) {
      redirectChains[details.tabId] = [];
    }
    redirectChains[details.tabId].push(details.redirectUrl);
  }
});

// 최종 페이지 로딩 완료 시 서버로 로그 전송
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    const chain = redirectChains[details.tabId] || [];
    delete redirectChains[details.tabId]; // 사용 후 초기화

    chrome.storage.local.get("token", ({ token }) => {
      fetch("https://project-prossen.onrender.com", {
        // Render 배포 시 Render URL로 교체
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          url: details.url,
          transition: details.transitionType,
          redirectPath: chain,
        }),
      }).catch((err) => console.error("Traffic dispatch error:", err));
    });
  }
});
