import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { cancelExistingAlarm } from "@libs/server/alarmScheduler";

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
    // idempotent cancel: status와 무관하게 대상 알람 1건을 찾고, 없으면 이미 해제된 것으로 처리
    const alarmToCancel = await client.alarmSetting.findFirst({
      where: {
        chatRoomId: +id,
        userId: user.id,
      },
    });

    if (!alarmToCancel) {
      return res.status(200).json({
        ok: true,
        message: "Alarm already cancelled",
        cancelledAlarmId: null,
        canceled: false,
        alreadyCanceled: true,
      });
    }

    // Update status to CANCELED in database and cancel the scheduled job
    const cancelResult = await cancelExistingAlarm(alarmToCancel.id);
    if (!cancelResult.ok) {
      return res.status(500).json({
        ok: false,
        error: "Failed to cancel alarm",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Alarm cancelled successfully",
      cancelledAlarmId: alarmToCancel.id,
      canceled: cancelResult.canceled,
      alreadyCanceled: cancelResult.alreadyCanceled,
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
