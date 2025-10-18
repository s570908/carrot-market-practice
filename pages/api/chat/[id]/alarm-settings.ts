import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { AlarmStatus } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // chatRoomId
  const { alarmTime, triggerAt, disableAlarm, userId } = req.body;

  // userId를 body에서 받으므로 세션 검사 및 user.id 사용 제거
  if (!userId) {
    return res.status(401).json({ ok: false, error: "userId is required" });
  }
  if (!id) {
    return res.status(400).json({ ok: false, error: "chatRoomId is required" });
  }

  try {
    if (req.method === "POST") {
      // 알림 생성 (messageId 없이 chatRoomId, userId 기준)
      // 기존 SCHEDULED 알림이 있으면 에러 반환
      const existingAlarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId: +id,
          userId: userId,
          status: AlarmStatus.SCHEDULED,
        },
      });

      if (existingAlarm) {
        return res.status(400).json({
          ok: false,
          error:
            "이미 예약된 알림이 존재합니다. 기존 알림을 취소하거나 수정하세요.",
        });
      }

      // disableAlarm이 true면 알림을 생성하지 않고 성공 응답만 반환
      if (disableAlarm) {
        return res.status(200).json({
          ok: true,
          alarmSetting: null,
          message: "알림이 비활성화되었습니다.",
          disableAlarm: true,
          alarmTime,
        });
      }

      // 새 알림 생성
      const newAlarm = await client.alarmSetting.create({
        data: {
          userId: userId,
          chatRoomId: +id,
          alarmTime,
          triggerAt: new Date(triggerAt),
          status: AlarmStatus.SCHEDULED,
        },
      });

      return res.status(200).json({
        ok: true,
        alarmSetting: newAlarm,
        message: "알림이 예약되었습니다.",
        disableAlarm: false,
        alarmTime,
      });
    }

    if (req.method === "PUT") {
      // 알림 수정 (chatRoomId, userId 기준)
      const alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId: +id,
          userId: userId,
          status: AlarmStatus.SCHEDULED,
        },
      });

      if (!alarm) {
        return res.status(404).json({ ok: false, error: "Alarm not found" });
      }

      // disableAlarm이 true면 알림 취소
      if (disableAlarm) {
        const canceled = await client.alarmSetting.update({
          where: { id: alarm.id },
          data: { status: AlarmStatus.CANCELED },
        });
        return res.status(200).json({
          ok: true,
          alarmSetting: null,
          message: "Alarm canceled successfully",
          disableAlarm: true,
          alarmTime,
        });
      }

      // 알림 정보 업데이트
      const updatedAlarm = await client.alarmSetting.update({
        where: { id: alarm.id },
        data: {
          alarmTime,
          triggerAt: new Date(triggerAt),
        },
      });

      return res.status(200).json({
        ok: true,
        alarmSetting: updatedAlarm,
        message: "Alarm updated successfully",
        disableAlarm: false,
        alarmTime,
      });
    }

    if (req.method === "GET") {
      // 알림 조회 (chatRoomId, userId 기준)
      const alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId: +id,
          userId: userId,
          status: AlarmStatus.SCHEDULED,
        },
        orderBy: { triggerAt: "desc" },
      });
      return res.status(200).json({ ok: true, alarm });
    }

    if (req.method === "DELETE") {
      // 알림 삭제 (chatRoomId, userId 기준)
      const alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId: +id,
          userId: userId,
          status: AlarmStatus.SCHEDULED,
        },
      });
      if (!alarm) {
        return res.status(404).json({ ok: false, error: "Alarm not found" });
      }
      await client.alarmSetting.delete({ where: { id: alarm.id } });
      return res.status(200).json({ ok: true, message: "Alarm deleted" });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("AlarmSetting CRUD error:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "PUT", "DELETE"], handler })
);
