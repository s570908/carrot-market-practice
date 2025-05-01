import webPush from "web-push";

// VAPID 키 생성 또는 환경 변수에서 불러오기
export function generateVAPIDKeys() {
  // 실제 배포 환경에서는 환경 변수에서 불러오는 것이 좋습니다
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  // 개발 환경에서는 키를 생성하고 콘솔에 출력
  const vapidKeys = webPush.generateVAPIDKeys();
  console.log("VAPID 키를 생성했습니다. 환경 변수에 설정하세요:");
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

  return vapidKeys;
}

// 웹 푸시 설정
export function setupWebPush() {
  const keys = generateVAPIDKeys();

  webPush.setVapidDetails(
    "mailto:your-email@example.com", // 서비스 관리자 이메일 주소
    keys.publicKey,
    keys.privateKey
  );

  return webPush;
}

// 푸시 알림 전송 함수
export async function sendPushNotification(subscription: PushSubscription, payload: any) {
  const webPushInstance = setupWebPush();

  // Ensure subscription object matches the expected type
  const formattedSubscription = {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: subscription.getKey("p256dh")
        ? Buffer.from(subscription.getKey("p256dh")!).toString("base64")
        : "",
      auth: subscription.getKey("auth")
        ? Buffer.from(subscription.getKey("auth")!).toString("base64")
        : "",
    }, // Retrieve keys using getKey method
  };

  try {
    await webPushInstance.sendNotification(formattedSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("푸시 알림 전송 실패:", error);
    return { success: false, error };
  }
}
