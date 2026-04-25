import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { AlarmStatus } from "@prisma/client";
import { cancelExistingAlarm, scheduleAlarmById } from "@/libs/server/alarmScheduler";

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
    req.method !== "POST" &&
    req.method !== "DELETE" &&
    req.method !== "PUT"
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
    // 멱등 삭제: SCHEDULED만 삭제 대상, SENT는 alreadySent로 응답
    try {
      const scheduledAlarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId,
          userId: user.id,
          status: AlarmStatus.SCHEDULED,
        },
      });

      if (scheduledAlarm) {
        await client.alarmSetting.delete({
          where: { id: scheduledAlarm.id },
        });
        return res.status(200).json({ ok: true, deleted: true });
      }

      const sentAlarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId,
          userId: user.id,
          status: AlarmStatus.SENT,
        },
      });

      if (sentAlarm) {
        return res.status(200).json({
          ok: true,
          alreadySent: true,
          deleted: false,
        });
      }

      return res.status(200).json({ ok: true, alreadyDeleted: true });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to delete alarm setting" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { alarmTime, triggerAt, status, disableAlarm } = req.body;
      const flowId = `alarm-put-${chatRoomId}-${user.id}-${Date.now()}`;

      console.log("[alarm-flow] put_start", {
        flowId,
        chatRoomId,
        userId: user.id,
        disableAlarm,
        alarmTime,
        triggerAt,
      });

      // disableAlarm=true 이면 시간값 없이도 성공 처리
      if (disableAlarm === true) {
        const existingAlarm = await client.alarmSetting.findFirst({
          where: {
            chatRoomId,
            userId: user.id,
          },
        });

        if (!existingAlarm) {
          return res.status(200).json({
            ok: true,
            disabled: true,
            alreadyDisabled: true,
            alarm: null,
          });
        }

        const cancelResult = await cancelExistingAlarm(existingAlarm.id, {
          flowId,
          reason: "disable_alarm",
          chatRoomId,
          userId: user.id,
        });
        if (!cancelResult.ok) {
          return res.status(500).json({
            ok: false,
            error: "Failed to cancel alarm",
          });
        }

        return res.status(200).json({
          ok: true,
          disabled: true,
          canceled: cancelResult.canceled,
          alreadyCanceled: cancelResult.alreadyCanceled,
          alarm: null,
        });
      }

      if (!alarmTime || !triggerAt) {
        return res.status(400).json({ ok: false, error: "alarmTime and triggerAt are required" });
      }
      // 1. 가장 처음 것을 찾는다
      let alarm = await client.alarmSetting.findFirst({
        where: {
          chatRoomId,
          userId: user.id,
        },
      });

      if (alarm) {
        const previousTriggerAt = alarm.triggerAt?.toISOString?.();
        // 2. 있으면 업데이트
        alarm = await client.alarmSetting.update({
          where: { id: alarm.id },
          data: {
            alarmTime,
            triggerAt: new Date(triggerAt),
            // 항상 SCHEDULED로 상태를 되돌림 (알림 재설정 시)
            status: AlarmStatus.SCHEDULED,
          },
        });
        // --- 추가: 알람 예약 ---
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          req.headers.origin ||
          `http://${req.headers.host}`;
        const scheduled = await scheduleAlarmById(alarm.id, baseUrl, {
          flowId,
          reason: "put_update_reschedule",
          chatRoomId,
          userId: user.id,
        });
        console.log(
          `[알림 PUT] scheduleAlarmById 호출됨: flowId=${flowId}, alarmId=${alarm.id}, previousTriggerAt=${previousTriggerAt}, nextTriggerAt=${alarm.triggerAt.toISOString()}, result=${scheduled}`
        );
        return res.status(200).json({ ok: true, alarm, updated: true, scheduled });
      } else {
        // 3. 없으면 생성
        alarm = await client.alarmSetting.create({
          data: {
            chatRoomId,
            userId: user.id,
            alarmTime,
            triggerAt: new Date(triggerAt),
            status: status ?? AlarmStatus.SCHEDULED,
          },
        });
        // --- 추가: 알람 예약 ---
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          req.headers.origin ||
          `http://${req.headers.host}`;
        const scheduled = await scheduleAlarmById(alarm.id, baseUrl, {
          flowId,
          reason: "put_create_schedule",
          chatRoomId,
          userId: user.id,
        });
        console.log(
          `[알림 PUT] scheduleAlarmById 호출됨: flowId=${flowId}, alarmId=${alarm.id}, nextTriggerAt=${alarm.triggerAt.toISOString()}, result=${scheduled}`
        );
        return res.status(201).json({ ok: true, alarm, created: true, scheduled });
      }
    } catch (error) {
      return res.status(500).json({ ok: false, error: "Failed to upsert alarm setting" });
    }
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST", "DELETE", "PUT"],
    handler,
    isPrivate: true,
  })
);
