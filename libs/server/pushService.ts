import webpush from 'web-push';
import client from '@libs/client/client';
import { PushSubscription, PushPayload } from '@/apiLibs/atypes'; // 중앙화된 타입 임포트
import { PushSubscriptionStatus } from '@prisma/client';

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
    // DB에서 해당 endpoint의 구독 상태를 확인
    const dbSub = await client.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint }
    });
    
    if (!dbSub) {
      throw new Error("subscription not found in database");
    }
    
    if (dbSub.status !== PushSubscriptionStatus.ACTIVE) {
      throw new Error(`${dbSub.status.toLowerCase()}`);
    }

    // payload를 문자열로 변환
    const stringifiedPayload = JSON.stringify(payload);

    console.log("before webpush.sendNotification:", { subscription, stringifiedPayload });
    // 푸시 알림 전송
    await webpush.sendNotification(
      subscription,
      stringifiedPayload
    );

    console.log("Push notification sent successfully");
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    
    // 410 Gone 처리: 구독 만료/삭제 시 DB에서 비활성화
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410 && 'endpoint' in error) {
      try {
        const endpoint = typeof error.endpoint === 'string' ? error.endpoint : undefined;
        if (endpoint) {
          const dbSub = await client.pushSubscription.findFirst({ where: { endpoint } });
          if (dbSub) {
            await client.pushSubscription.update({
              where: { id: dbSub.id },
              data: { status: PushSubscriptionStatus.EXPIRED, updatedAt: new Date() }
            });
            console.log(`Subscription ${dbSub.id} marked as EXPIRED due to 410 Gone.`);
          }
        }
      } catch (dbError) {
        console.error('DB update error for expired subscription:', dbError);
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * 개별 사용자에게 푸시 알림 전송 함수
 */
export async function sendPushNotificationToUser(userId: number, payload: PushPayload) {  try {
    // 활성 상태인 사용자 구독 정보만 조회
    const subscriptions = await client.pushSubscription.findMany({
      where: { 
        userId,
        status: PushSubscriptionStatus.ACTIVE // enum 값 사용
      }
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
            // 구독 만료/취소 상태 처리
          if (isWebPushError(error)) {
            if (error.statusCode === 410) {
            // 410 Gone: 구독이 만료되었거나 취소됨
            console.log(`Subscription ${subscription.id} expired/cancelled, marking as EXPIRED`);
            await client.pushSubscription.update({
              where: { id: subscription.id },
              data: { 
                status: PushSubscriptionStatus.EXPIRED, // enum 사용
                updatedAt: new Date()
              }
            });
            } else if (error.statusCode === 404) {
              // 404 Not Found: 구독이 존재하지 않음
            console.log(`Subscription ${subscription.id} not found, marking as INVALID`);
            await client.pushSubscription.update({
              where: { id: subscription.id },
              data: { 
                status: PushSubscriptionStatus.INVALID, // enum 사용
                updatedAt: new Date()
              }
            });
            } else if (error.statusCode === 413) {
              // 413 Payload Too Large: 페이로드가 너무 큼
              console.log(`Payload too large for subscription ${subscription.id}`);
            }
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
  console.log("getVapidPublicKey()--VAPID Public Key:", vapidPublicKey);
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
