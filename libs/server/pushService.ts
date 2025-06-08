import webpush from 'web-push';
import client from '@libs/client/client';
import { PushSubscription, PushPayload } from '@/apiLibs/atypes'; // 중앙화된 타입 임포트

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

/**
 * 단일 구독에 직접 푸시 알림 전송 함수
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // payload를 문자열로 변환
    const stringifiedPayload = JSON.stringify(payload);

    // 푸시 알림 전송
    await webpush.sendNotification(
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

/**
 * 개별 사용자에게 푸시 알림 전송 함수
 */
export async function sendPushNotificationToUser(userId: number, payload: PushPayload) {
  try {
    // 사용자 구독 정보 조회
    const subscriptions = await client.pushSubscription.findMany({
      where: { userId }
    });
    
    if (!subscriptions.length) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: false, reason: "No subscriptions found" };
    }
    
    // 각 구독에 푸시 알림 전송
    const promises = subscriptions.map(async (subscription) => {
        try {
          // 웹푸시 API에서 요구하는 형식으로 구독 정보 변환
          const pushConfig: PushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          // 통합된 sendPushNotification 함수 사용
          const result = await sendPushNotification(pushConfig, payload);
          
          if (result.success) {
            console.log(`Push notification sent to subscription ${subscription.id}`);
            return { success: true, subscriptionId: subscription.id };
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          console.error(`Push error for subscription ${subscription.id}:`, error);
          
          // statusCode 410 처리 - 이 경우는 구독이 더 이상 유효하지 않음을 의미합니다
          if (isWebPushError(error) && error.statusCode === 410) {
            await client.pushSubscription.delete({
              where: { id: subscription.id }
            });
          }
          
          return { success: false, error };
        }
    });
    
    await Promise.all(promises);
    return { sent: true, count: subscriptions.length };
  } catch (error) {
    console.error("Push notification error:", error);
    return { sent: false, error };
  }
}

// 클라이언트에서 사용할 공개 키 반환 함수
export function getVapidPublicKey() {
  return vapidPublicKey;
}

/**
 * 푸시 알림 전송 재시도 기능
 * 최대 n번까지 재시도하며, 실패할 때마다 지연 시간을 늘림
 */
export async function retryPushNotification(userId: number, payload: PushPayload, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await sendPushNotificationToUser(userId, payload);
      if (result && (typeof result === 'boolean' ? result : result.sent)) {
        return true;
      }
      
      console.log(`Push attempt ${i+1}/${retries} returned falsy result, retrying...`);
    } catch (error) {
      console.error(`Push retry ${i+1}/${retries} failed:`, error);
      
      // 마지막 재시도가 아니면 지연 후 다시 시도 (exponential backoff)
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1초, 2초, 4초 등으로 지연 증가
        console.log(`Waiting ${delay}ms before next retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`All ${retries} push notification attempts failed for userId: ${userId}`);
  return false;
}

// 이전 코드와의 호환성을 위한 별칭 함수
// 기존 sendPushNotification(userId, payload) 호출을 지원
export const sendPushNotificationLegacy = sendPushNotificationToUser;
