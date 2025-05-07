import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import client from "@libs/client/client";

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
      body: { subscription }
    } = req;

    if (!user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    try {
      // 기존 구독 정보가 있다면 삭제
      await client.pushSubscription.deleteMany({
        where: {
          userId: user.id,
          endpoint: subscription.endpoint
        }
      });

      // 새 구독 정보 저장
      const newSubscription = await client.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });

      console.log("Push subscription saved:", newSubscription.id);
      return res.json({ ok: true });
    } catch (error) {
      console.error("Push subscription save error:", error);
      return res.status(500).json({ ok: false, error: "Failed to save subscription" });
    }
  }

  res.status(405).end();
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
