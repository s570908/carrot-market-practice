// 1. 사용자 브라우저에서 구독 객체 생성 과정
// @ts-ignore
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  // @ts-ignore
  applicationServerKey: vapidPublicKey,
});

// 생성된 구독 객체 (간소화 버전)
const subscriptionData = {
  endpoint: "https://fcm.googleapis.com/fcm/send/device123...",
  keys: {
    p256dh: "BKy_7HuLn0FF_mZL...", // 공개 키 (암호화에 사용)
    auth: "LK39wYfFqkLRvT4c...", // 비밀 인증 토큰 (메시지 무결성 확인에 사용)
  },
};

// 2. 이 구독 정보를 서버에 저장
// @ts-ignore
await fetch("/api/push/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subscription: subscriptionData }),
});
