import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const messageId = Number(req.query.messageId);

  if (!messageId) {
    return res.status(400).json({ ok: false, error: "messageId is required" });
  }

  try {
    // messageId로 연결된 SCHEDULED AlarmSetting 1개만 조회
    const alarm = await client.alarmSetting.findFirst({
      where: { messageId, status: "SCHEDULED" },
      orderBy: { triggerAt: "desc" },
      select: {
        id: true,
        messageId: true,
        alarmTime: true,
        triggerAt: true,
        status: true,
        userId: true,
        chatRoomId: true,
        chatMeetupId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      ok: true,
      alarm,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: "Failed to fetch alarm setting" });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler, isPrivate: true })
);
