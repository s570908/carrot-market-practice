import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { cancelExistingAlarm } from "@libs/server/alarmScheduler";
import { AlarmStatus } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { user } = req.session;

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!id) {
    return res.status(400).json({
      ok: false,
      error: "Chat room id is required",
    });
  }

  try {
    // Find the alarm setting to cancel
    const alarmToCancel = await client.alarmSetting.findFirst({
      where: {
        chatRoomId: +id,
        userId: user.id,
        status: AlarmStatus.SCHEDULED,
      },
    });

    if (!alarmToCancel) {
      return res.status(404).json({
        ok: false,
        error: "No scheduled alarm found",
      });
    }

    // Update status to CANCELED in database and cancel the scheduled job
    await cancelExistingAlarm(alarmToCancel.id);

    return res.status(200).json({
      ok: true,
      message: "Alarm cancelled successfully",
      cancelledAlarmId: alarmToCancel.id,
    });
  } catch (error) {
    console.error("Error cancelling alarm:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
