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
    // 변경된 prisma model에서는 messageId가 필요없으므로 chatRoomId, userId 등으로 조회
    // 예시: userId와 chatRoomId로 조회 (필요에 따라 수정)
    const alarm = await client.alarmSetting.findFirst({
      where: {
        // chatRoomId: ...,
        // userId: ...,
        status: "SCHEDULED",
      },
      orderBy: { triggerAt: "desc" },
      select: {
        id: true,
        alarmTime: true,
        triggerAt: true,
        status: true,
        userId: true,
        chatRoomId: true,
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
