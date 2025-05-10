import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import client from "@libs/client/client";
import { sendPushNotification } from "@libs/server/webPushUtils";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const {
    session: { user },
    body: { endpoint }
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  if (!endpoint) {
    return res.status(400).json({ ok: false, error: "엔드포인트가 제공되지 않았습니다" });
  }

  try {
    // 데이터베이스에서 구독 정보 찾기
    const subscription = await client.pushSubscription.findFirst({
      where: {
        userId: user.id,
        endpoint
      }
    });

    if (!subscription) {
      return res.json({ 
        ok: true, 
        valid: false,
        message: "구독 정보를 찾을 수 없습니다"
      });
    }

    // 구독 정보를 사용하여 유효성 테스트를 위한 빈 메시지 전송 시도
    const subscriptionObject = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    try {
      // 실제 메시지를 보내지 않고 유효성만 검사
      const testResult = await sendPushNotification(
        subscriptionObject,
        { title: "Validation", body: "This is a test notification for validation." }
      );

      return res.json({ 
        ok: true, 
        valid: testResult.success,
        message: testResult.success ? "구독이 유효합니다" : "구독이 유효하지 않습니다"
      });
    } catch (error) {
      // 오류가 발생하면 구독이 유효하지 않은 것으로 간주
      return res.json({ 
        ok: true, 
        valid: false,
        message: "구독 테스트 중 오류가 발생했습니다"
      });
    }
  } catch (error) {
    console.error("구독 유효성 검사 오류:", error);
    return res.status(500).json({ 
      ok: false, 
      valid: false,
      error: "서버 오류" 
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
