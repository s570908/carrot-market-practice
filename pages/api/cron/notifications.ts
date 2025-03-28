// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\api\cron\notifications.ts
//import { NextApiRequest, NextApiResponse } from "next";
import { checkAndSendNotifications } from "@/libs/client/notificationService";

import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

// 이 API는 Cron 작업으로 정기적으로 호출됩니다
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // API 키 검증 (보안을 위해)
  const { apiKey } = req.query;

  if (apiKey !== process.env.CRON_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    // 알림 확인 및 전송
    const sentCount = await checkAndSendNotifications();

    return res.status(200).json({
      success: true,
      sentCount,
    });
  } catch (error) {
    console.error("Notification processing error:", error);
    return res.status(500).json({
      error: "Failed to process notifications",
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
