import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { AlarmStatus } from "@prisma/client";
import { cancelExistingAlarm } from "@/libs/server/alarmScheduler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    session: { user }, // login user
  } = req;

  const chatRoomId = Number(req.query.chatRoomId);

  if (!chatRoomId) {
    return res.status(400).json({ ok: false, error: "chatRoomId is required" });
  }
  const { alarmTime, status } = req.body;

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (
    req.method !== "GET" &&
    req.method !== "PATCH" &&
    req.method !== "POST" &&
    req.method !== "DELETE"
  ) {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (req.method === "GET") {
    const chatRoomId = Number(req.query.chatRoomId);

    try {
      // chatRoomId로 연결된 SCHEDULED AlarmSetting 1개만 조회
      // 변경된 prisma model에서는 messageId가 필요없으므로 chatRoomId, userId 등으로 조회
      // 예시: userId와 chatRoomId로 조회 (필요에 따라 수정)
      // findUnique는 id 등 단일 고유 필드만 사용 가능, 여러 필드 조합은 findFirst로 조회해야 함
      const alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId,
          userId: user?.id,
          status: AlarmStatus.SCHEDULED,
        },
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

      if (!alarm) {
        return res.status(200).json({
          ok: false,
          exists: false,
          alarm: null,
        });
      }

      return res.status(200).json({
        ok: true,
        exists: true,
        alarm,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to fetch alarm setting" });
    }
  }

  if (req.method === "PATCH") {
    try {
      // disableAlarm이 true면 알림 삭제 및 스케줄러 취소
      if (req.body.disableAlarm === true) {
        // SCHEDULED 상태의 알림만 삭제
        const alarm = await client.alarmSetting.findFirst({
          where: {
            chatRoomId,
            userId: user?.id,
            status: AlarmStatus.SCHEDULED,
          },
        });

        if (!alarm) {
          return res
            .status(404)
            .json({ ok: false, error: "No scheduled alarm found" });
        }

        // 1. DB에서 알림 삭제
        await client.alarmSetting.delete({
          where: { id: alarm.id },
        });

        // 2. 스케줄러에서 알림 취소
        try {
          await cancelExistingAlarm(alarm.id);
        } catch (e) {
          // 스케줄러 취소 실패는 무시 (로그만)
          console.warn("스케줄러 알림 취소 실패:", e);
        }

        return res.status(200).json({
          ok: true,
          deletedAlarmId: alarm.id,
        });
      }

      // SCHEDULED 상태의 알림만 업데이트
      const alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId,
          userId: user?.id,
          status: AlarmStatus.SCHEDULED,
        },
      });

      if (!alarm) {
        return res
          .status(404)
          .json({ ok: false, error: "No scheduled alarm found" });
      }

      const updatedAlarm = await client.alarmSetting.update({
        where: { id: alarm.id },
        data: {
          alarmTime: alarmTime ?? alarm.alarmTime,
          status: status ?? alarm.status,
        },
      });

      return res.status(200).json({
        ok: true,
        alarm: updatedAlarm,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update alarm setting" });
    }
  }

  if (req.method === "POST") {
    // 알림 생성
    try {
      const { alarmTime, triggerAt } = req.body;
      if (!alarmTime || !triggerAt) {
        return res
          .status(400)
          .json({ ok: false, error: "alarmTime and triggerAt are required" });
      }
      const newAlarm = await client.alarmSetting.create({
        data: {
          chatRoomId,
          userId: user.id,
          alarmTime,
          triggerAt: new Date(triggerAt),
          status: AlarmStatus.SCHEDULED,
        },
      });
      return res.status(201).json({ ok: true, alarm: newAlarm });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to create alarm setting" });
    }
  }

  if (req.method === "DELETE") {
    // 알림 삭제 (status와 관계없이 삭제)
    try {
      const alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId,
          userId: user.id,
          // status 조건 제거
        },
      });
      if (!alarm) {
        return res.status(404).json({ ok: false, error: "No alarm found" });
      }
      await client.alarmSetting.delete({
        where: { id: alarm.id },
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to delete alarm setting" });
    }
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET", "PATCH", "POST", "DELETE"],
    handler,
    isPrivate: true,
  })
);
