import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { generateVAPIDKeys } from "@libs/server/webPushUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // VAPID 키 가져오기
  const vapidKeys = generateVAPIDKeys();

  // POST 요청 처리 (구독 저장)
  if (req.method === "POST") {
    try {
      const { subscription } = req.body;
      const {
        session: { user },
      } = req;

      if (!user) {
        return res.status(401).json({ ok: false, error: "인증되지 않은 사용자" });
      }

      // 이미 존재하는 구독인지 확인
      const existingSub = await client.pushSubscription.findFirst({
        where: {
          userId: user.id,
          endpoint: subscription.endpoint,
        },
      });

      if (existingSub) {
        // 이미 구독 정보가 있으면 업데이트
        await client.pushSubscription.update({
          where: { id: existingSub.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            updatedAt: new Date(),
          },
        });
      } else {
        // 새로운 구독 정보라면 저장
        await client.pushSubscription.create({
          data: {
            userId: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth, // auth 키 저장
          },
        });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("구독 저장 오류:", error);
      return res.status(500).json({ ok: false, error: "구독 정보 저장 실패" });
    }
  }

  // GET 요청 처리 (VAPID 공개 키 반환)
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      publicKey: vapidKeys.publicKey,
    });
  }

  return res.status(405).end(); // Method Not Allowed
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST"],
    handler,
    isPrivate: true,
  })
);
