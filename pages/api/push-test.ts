import { NextApiRequest, NextApiResponse } from "next";
import { sendPushNotification } from "@/libs/server/pushService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: "Subscription required" });
    }

    // 테스트 푸시 발송 (실제로는 보내지 않고 유효성만 확인)
    const testPayload = {
      title: "구독 테스트",
      body: "이 메시지는 구독 유효성 테스트용입니다.",
    };

    const result = await sendPushNotification(subscription, testPayload);

    if (result.success) {
      res.status(200).json({ valid: true });
    } else {
      res.status(410).json({ valid: false, error: result.error });
    }
  } catch (error) {
    console.error("구독 테스트 중 오류:", error);
    res.status(410).json({ valid: false, error: "Subscription invalid" });
  }
}
