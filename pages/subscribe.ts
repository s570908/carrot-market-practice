import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import client from "@libs/client/client";

// 엔드포인트에서 기본 URL 패턴 추출
function getEndpointPattern(endpoint: string): string {
  // FCM 패턴 (fcm/send/ 또는 /wp/)
  if (endpoint.includes('/fcm/send/')) {
    return endpoint.split('/fcm/send/')[0] + '/fcm/send/';
  } else if (endpoint.includes('/wp/')) {
    return endpoint.split('/wp/')[0] + '/wp/';
  }
  // 기타 패턴 (일반적인 도메인 추출)
  try {
    const url = new URL(endpoint);
    return `${url.protocol}//${url.hostname}${url.pathname.split('/').slice(0, -1).join('/')}/`;
  } catch (e) {
    return endpoint; // URL 파싱 실패 시 원본 반환
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID public key is not set");
      return res.status(500).json({ ok: false, error: "Server configuration error" });
    }
    return res.json({ ok: true, publicKey: vapidPublicKey });
  }

  if (req.method === "POST") {
    const {
      session: { user },
      body: { subscription, browserId } // 브라우저 ID 추가
    } = req;

    if (!user) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    try {
      // 엔드포인트 기본 패턴 추출
      const endpointPattern = getEndpointPattern(subscription.endpoint);
      console.log("Endpoint Pattern:", endpointPattern);

      // 기존 구독 찾기 (같은 사용자, 같은 엔드포인트 패턴)
      const existingSubscriptions = await client.pushSubscription.findMany({
        where: {
          userId: user.id,
          endpoint: {
            startsWith: endpointPattern
          }
        }
      });

      if (existingSubscriptions.length > 0) {
        console.log(`기존 구독 발견: ${existingSubscriptions.length}개`);
        
        // 기존 구독 모두 삭제 (중복 방지)
        await client.pushSubscription.deleteMany({
          where: {
            id: {
              in: existingSubscriptions.map(sub => sub.id)
            }
          }
        });
      }

      // 새 구독 생성
      const savedSubscription = await client.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          browserId: browserId || null, // 브라우저 ID 저장 (선택적)
          endpointPattern // 엔드포인트 패턴 저장
        }
      });

      console.log("푸시 구독 저장 완료:", savedSubscription.id);
      return res.json({ 
        ok: true, 
        subscriptionId: savedSubscription.id,
        message: "구독이 성공적으로 저장되었습니다"
      });
    } catch (error) {
      console.error("Push subscription save error:", error);
      return res.status(500).json({ 
        ok: false, 
        error: "구독 정보 저장 중 오류가 발생했습니다" 
      });
    }
  }

  res.status(405).json({ ok: false, error: "허용되지 않는 메서드입니다" });
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
