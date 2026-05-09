import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { sendPushNotification } from "@libs/server/pushService";

// PushPayload 타입에 requireInteraction 추가
type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  timestamp?: number;
  data?: any;
  requireInteraction?: boolean;
};

// 디버깅 로그 추가
function debugLog(message: string, data?: any) {
  console.log(`[PUSH_DEBUG] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  const {
    session: { user },
    body: { recipientId, title, body, icon, data, useCurrentSubscriptionOnly, currentSubscription, directSubscription },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "인증되지 않음" });
  }

  try {
    let subscriptionsToUse = [];
    
    // 디버그 로그
    debugLog("요청 받음", { 
      useCurrentOnly: !!useCurrentSubscriptionOnly, 
      hasCurrentSub: !!currentSubscription,
      hasDirectSub: !!directSubscription, 
      recipientId 
    });
    
    // 클라이언트에서 직접 전송한 구독 정보가 있는 경우 사용
    if (directSubscription) {
      debugLog("클라이언트에서 직접 전송한 구독 정보 사용");
      subscriptionsToUse = [{
        endpoint: directSubscription.endpoint,
        p256dh: directSubscription.keys.p256dh,
        auth: directSubscription.keys.auth,
        userId: recipientId || user.id,
      }];
    } 
    // 현재 구독만 사용하도록 지정된 경우
    else if (useCurrentSubscriptionOnly && currentSubscription) {
      debugLog("현재 구독만 사용");
      subscriptionsToUse = [{
        endpoint: currentSubscription.endpoint,
        p256dh: currentSubscription.keys.p256dh,
        auth: currentSubscription.keys.auth,
        userId: recipientId || user.id,
      }];
    }
    // 서버가 저장된 구독 정보(auth 키 포함)를 불러옴
    else {
      const targetUserId = recipientId || user.id;
      debugLog(`사용자 ID ${targetUserId}의 구독 정보 DB에서 조회 중`);
      
      // 중요: 중복 제거 로직 추가 (endpoint로 중복 필터링)
      const allSubscriptions = await client.pushSubscription.findMany({
        where: {
          userId: targetUserId,
        },
      });
      
      // 구독 엔드포인트 기준 중복 제거 (Set 사용)
      const uniqueEndpoints = new Set();
      subscriptionsToUse = allSubscriptions.filter(sub => {
        if (uniqueEndpoints.has(sub.endpoint)) {
          debugLog(`중복 구독 발견, 제외함: ${sub.endpoint.substring(0, 30)}...`);
          return false;
        }
        uniqueEndpoints.add(sub.endpoint);
        return true;
      });
      
      debugLog(`DB에서 ${allSubscriptions.length}개 구독 조회, 중복 제거 후 ${subscriptionsToUse.length}개 사용`);
      
      if (subscriptionsToUse.length === 0) {
        return res.status(404).json({ ok: false, error: "구독 정보가 없습니다" });
      }
    }

    // 모든 구독 정보로 푸시 알림 전송
    debugLog(`${subscriptionsToUse.length}개의 구독 정보로 알림 전송 시도`);
    // subscriptionsToUse 배열의 각 요소마다 푸시 전송 시도 후 결과를 results 배열에 같은 순서로 저장
    const results = await Promise.all(
      subscriptionsToUse.map(async (sub) => {
        try {
          // 엔드포인트 로깅 (디버깅용)
          debugLog("푸시 알림 전송 대상 엔드포인트:", sub.endpoint);
          
          // 브라우저가 반환한 형식 그대로 구독 정보 구성
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            }
          } as const;

          // 엔드포인트 및 키 데이터 검증
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            debugLog("잘못된 구독 정보:", { 
              hasEndpoint: !!sub.endpoint, 
              hasP256dh: !!sub.p256dh, 
              hasAuth: !!sub.auth 
            });
            return { 
              success: false, 
              error: "구독 정보가 불완전합니다", 
              needsCleanup: true 
            };
          }


          const payload: PushPayload = {
            title,
            body,
            icon: icon || "/icons/carrot-logo.png",
            badge: "/icons/carrot-badge.png",
            timestamp: Date.now(),
            data,
            requireInteraction: true
          };

          // 원본 구독 정보 그대로 전달
          const result: { success: boolean; error?: string; statusCode?: number; needsCleanup?: boolean } = await sendPushNotification(subscription, payload);
          
          // 수동으로 구독 삭제 여부 판단 (404/410은 구독 정보가 더 이상 유효하지 않음을 의미)
          if (!result.success && ('statusCode' in result) && (result.statusCode === 404 || result.statusCode === 410)) {
            result.needsCleanup = true;
          }
          
          return result;
        } catch (error) {
          debugLog(`개별 알림 전송 실패:`, error);
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      })
    );

    // 결과 분석
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    debugLog(`전송 결과: 성공=${successCount}, 실패=${failCount}`);
    
    // 실패한 구독 정보 삭제 (DB에서 가져온 경우에만)
    if (!directSubscription && !useCurrentSubscriptionOnly) {
      // needsCleanup 플래그가 명시적으로 true인 경우만 구독 정보 삭제
      // results와 subscriptionsToUse 사이에는 인덱스 기반 1:1 대응 관계가 있습니다:
      // 핵심 관계
      // 병렬 배열(Parallel Arrays) 구조:
      // subscriptionsToUse[i]: i번째 구독 정보
      // results[i]: 정확히 i번째 구독으로 푸시 알림을 전송한 결과
      const failedSubs = results
        .map((result, index) => (result.success || result.needsCleanup !== true) ? null : subscriptionsToUse[index])
        // sub is { id: number } & typeof sub 는 타입가드: 원래 sub의 모든 속성을 유지하면서, id 속성이 number 타입인 것을 보장
        // sub이 null이 아니고 id 속성이 있는 경우에만 필터링
        // ID 필수 조건: DB에서 레코드를 삭제하려면 반드시 id 필드가 있어야 합니다
        // 오류 방지: id 속성이 없는 객체를 포함하면 DB 삭제 쿼리가 실패하므로, 사전에 확인이 필요합니다
        .filter((sub): sub is { id: number } & typeof sub => sub !== null && 'id' in sub);

      if (failedSubs.length > 0) {
        debugLog(`${failedSubs.length}개의 실패한 구독 정보 삭제 중`);
        
        try {
          // 안전하게 ID가 있는 경우에만 삭제
          const subsToDelete = failedSubs
            .map((sub) => sub.id);
            
          if (subsToDelete.length > 0) {
            await client.pushSubscription.deleteMany({
              where: {
                id: {
                  in: subsToDelete,  // 예: [101, 203, 405] 배열이 있다면 ID가 101, 203, 405인 모든 레코드에 작업 적용
                },
              },
            });
            debugLog("구독 정보 삭제 완료");
          }
        } catch (deleteError) {
          debugLog("구독 정보 삭제 중 오류:", deleteError);
        }
      }
    }

    return res.status(200).json({ 
      ok: true, 
      sent: successCount,
      failed: failCount,
      total: results.length,
      message: `${successCount}개의 알림이 성공적으로 전송되었습니다${failCount > 0 ? `, ${failCount}개 실패` : ''}`
    });
  } catch (error) {
    debugLog("푸시 알림 전송 오류:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "알림 전송 실패", 
      details: error instanceof Error ? error.message : "알 수 없는 오류" 
    });
  }
}

export default withApiSession(
  withHandler({
    methods: ["POST"],
    handler,
    isPrivate: true,
  })
);
