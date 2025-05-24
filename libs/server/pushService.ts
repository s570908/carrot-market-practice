import webpush from 'web-push';
import client from '@libs/client/client';

// VAPID 키 설정 
// 실제 배포 시에는 .env 파일에서 환경 변수로 관리해야 합니다
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID keys not set');
}

// VAPID 세부 정보 설정 (푸시 서비스에 대한 인증 정보)
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:example@example.com', // 연락처 이메일 (푸시 서비스가 문제 발생 시 연락할 주소)
  vapidPublicKey,
  vapidPrivateKey
);

// web-push 라이브러리의 오류 인터페이스 정의
interface WebPushError {
  statusCode?: number;
  body?: string;
  endpoint?: string;
}

// 타입 가드 함수
function isWebPushError(error: unknown): error is WebPushError {
  return typeof error === 'object' && error !== null && 'statusCode' in error;
}

// 개별 사용자에게 푸시 알림 전송 함수
export async function sendPushNotification(userId: number, payload: any) {
  try {
    // 사용자의 모든 푸시 구독 정보 조회
    const subscriptions = await client.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return false;
    }

    // 모든 기기에 푸시 알림 전송 시도
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          // 웹 푸시 API에서 요구하는 형식으로 구독 정보 변환
          const pushConfig = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          // 알림 전송
          await webpush.sendNotification(
            pushConfig,
            JSON.stringify(payload)
          );
          
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error(`Push error for subscription ${subscription.id}:`, error);
          
          if (isWebPushError(error) && error.statusCode === 410) {
            await client.pushSubscription.delete({
              where: { id: subscription.id }
            });
          }
          
          return { success: false, error };
        }
      })
    );

    // 최소 하나의 기기에 성공적으로 전송되었는지 확인
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && (result.value as any).success
    ).length;

    return successCount > 0;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return false;
  }
}

// 클라이언트에서 사용할 공개 키 반환 함수
export function getVapidPublicKey() {
  return vapidPublicKey;
}
