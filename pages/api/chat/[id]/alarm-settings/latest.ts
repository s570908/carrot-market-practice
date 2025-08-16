import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { AlarmStatus } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { user } = req.session;

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!id) {
    return res
      .status(400)
      .json({ ok: false, error: "Chat room id is required" });
  }

  try {
    // Find the latest alarm setting for this chatRoom
    const latestAlarm = await client.alarmSetting.findFirst({
      where: {
        chatRoomId: +id,
        status: AlarmStatus.SCHEDULED,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      ok: true,
      alarm: latestAlarm,
    });
  } catch (error) {
    console.error("Error fetching latest alarm:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
