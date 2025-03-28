// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\api\appointments\[id]\notifications.ts
// import { NextApiRequest, NextApiResponse } from "next";
// import { withApiSession } from "@/lib/withSession";
// import client from "@/lib/client";

import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    session: { user },
  } = req;

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다." });
  }

  const appointmentId = Number(id);
  if (isNaN(appointmentId)) {
    return res.status(400).json({ ok: false, error: "유효하지 않은 약속 ID입니다." });
  }

  try {
    // 약속 정보 조회
    const appointment = await client.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "약속을 찾을 수 없습니다." });
    }

    // 주최자만 알림 관리 가능
    if (appointment.organizerId !== user.id) {
      return res.status(403).json({ ok: false, error: "알림을 관리할 권한이 없습니다." });
    }

    if (req.method === "POST") {
      // 알림 추가
      const { title, message, type = "PUSH", minutesBefore } = req.body;

      if (!title || !minutesBefore) {
        return res.status(400).json({ ok: false, error: "필수 정보가 누락되었습니다." });
      }

      const notification = await client.appointmentNotification.create({
        data: {
          appointment: {
            connect: {
              id: appointmentId,
            },
          },
          title,
          message,
          type,
          minutesBefore,
        },
      });

      return res.json({
        ok: true,
        notification,
      });
    } else if (req.method === "DELETE") {
      // 알림 제거
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ ok: false, error: "알림 ID가 필요합니다." });
      }

      await client.appointmentNotification.delete({
        where: {
          id: Number(notificationId),
        },
      });

      return res.json({
        ok: true,
      });
    } else {
      return res.status(405).end();
    }
  } catch (error) {
    console.error("약속 알림 API 오류:", error);
    return res.status(500).json({ ok: false, error: "알림 처리 중 오류가 발생했습니다." });
  }
}
export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
