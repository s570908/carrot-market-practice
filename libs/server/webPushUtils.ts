import webPush from 'web-push';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  timestamp?: number;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
) {
  try {
    // VAPID 설정 확인
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not set');
    }

    // VAPID 세부 정보 설정
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:example@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // payload를 문자열로 변환
    const stringifiedPayload = JSON.stringify(payload);

    // 푸시 알림 전송
    await webPush.sendNotification(
      subscription,
      stringifiedPayload
    );

    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
