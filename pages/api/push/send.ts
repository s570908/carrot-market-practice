import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { sendPushNotification } from "@libs/server/webPushUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  const {
    session: { user },
    body: { recipientId, title, body, icon, data, directSubscription },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "인증되지 않음" });
  }

  try {
    let subscriptionsToUse = [];
    
    // 클라이언트에서 직접 전송한 구독 정보가 있는 경우 사용
    if (directSubscription) {
      console.log("클라이언트에서 직접 전송한 구독 정보 사용");
      subscriptionsToUse = [{
        endpoint: directSubscription.endpoint,
        p256dh: directSubscription.keys.p256dh,
        auth: directSubscription.keys.auth,
        userId: recipientId,
      }];
    } else {
      // 서버가 저장된 구독 정보(auth 키 포함)를 불러옴
      console.log(`사용자 ID ${recipientId}의 구독 정보 DB에서 조회 중`);
      subscriptionsToUse = await client.pushSubscription.findMany({
        where: {
          userId: recipientId,
        },
      });
      
      if (subscriptionsToUse.length === 0) {
        return res.status(404).json({ ok: false, error: "구독 정보가 없습니다" });
      }
      console.log(`DB에서 ${subscriptionsToUse.length}개의 구독 정보 찾음`);
    }

    // 모든 구독 정보로 푸시 알림 전송
    console.log(`${subscriptionsToUse.length}개의 구독 정보로 알림 전송 시도`);
    const results = await Promise.all(
      subscriptionsToUse.map(async (sub) => {
        try {
          // web-push 라이브러리가 기대하는 형식으로 변환
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            expirationTime: null  // optional
          };

          const payload = {
            title,
            body,
            icon: icon || "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            timestamp: Date.now(),
            data,
          };

          // 알림 전송 전 로그
          console.log(`Endpoint ${sub.endpoint.substring(0, 30)}...로 알림 전송 시도`);
          
          // 명시적 타입으로 전달
          const result = await sendPushNotification(subscription, payload);
          
          // 전송 결과 로그
          console.log(`알림 전송 결과:`, result);
          
          return result;
        } catch (error) {
          console.error(`개별 알림 전송 실패:`, error);
          return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      })
    );

    // 결과 분석
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    // 실패한 구독 정보 삭제 (DB에서 가져온 경우에만)
    if (!directSubscription) {
      const failedSubs = results
        .map((result, index) => (result.success ? null : subscriptionsToUse[index]))
        .filter(Boolean);

      if (failedSubs.length > 0) {
        console.log(`${failedSubs.length}개의 실패한 구독 정보 삭제 중`);
        
        await client.pushSubscription.deleteMany({
          where: {
            id: {
              in: failedSubs
                .filter((sub): sub is { id: number } & typeof sub => sub !== null && 'id' in sub)
                .map((sub) => sub.id),
            },
          },
        });
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
    console.error("푸시 알림 전송 오류:", error);
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
