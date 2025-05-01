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
    body: { recipientId, title, body, icon, data },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "인증되지 않음" });
  }

  try {
    // 서버가 저장된 구독 정보(auth 키 포함)를 불러옴
    const subscriptions = await client.pushSubscription.findMany({
      where: {
        userId: recipientId,
      },
    });

    if (subscriptions.length === 0) {
      return res.status(404).json({ ok: false, error: "구독 정보가 없습니다" });
    }

    // 모든 구독 정보로 푸시 알림 전송
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth, // 저장된 auth 키 사용
          },
        };

        const payload = {
          title,
          body,
          icon: icon || "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          timestamp: Date.now(),
          data,
        };

        // auth 키를 사용하여 메시지 암호화하여 전송
        return sendPushNotification(subscription as any, payload);
      })
    );

    // 실패한 구독 정보 삭제 (옵션)
    const failedSubs = results
      .map((result, index) => (result.success ? null : subscriptions[index]))
      .filter(Boolean);

    if (failedSubs.length > 0) {
      await client.pushSubscription.deleteMany({
        where: {
          id: {
            in: failedSubs.map((sub) => sub!.id),
          },
        },
      });
    }

    return res.status(200).json({ ok: true, sent: subscriptions.length - failedSubs.length });
  } catch (error) {
    console.error("푸시 알림 전송 오류:", error);
    return res.status(500).json({ ok: false, error: "알림 전송 실패" });
  }
}

export default withApiSession(
  withHandler({
    methods: ["POST"],
    handler,
    isPrivate: true,
  })
);
