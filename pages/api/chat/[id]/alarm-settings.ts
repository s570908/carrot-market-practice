import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { scheduleNewAlarm } from "@libs/server/alarmScheduler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const {
      query: { id },
      body: { messageId, alarmTime, triggerAt, disableAlarm },
      session: { user },
    } = req;

    if (!id || !messageId) {
      return res.status(400).json({ ok: false, error: "필수 정보가 누락되었습니다." });
    }

    // 사용자 인증 확인
    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다." });
    }

    try {
      // 메시지와 관련된 약속 정보 가져오기
      const message = await client.sellerChat.findUnique({
        where: { id: +messageId },
        include: { chatMeetup: true }
      });

      // 메시지가 존재하지 않는 경우
      if (!message) {
        return res.status(404).json({ ok: false, error: "메시지를 찾을 수 없습니다." });
      }

      // 약속 정보가 없는 경우
      if (!message.chatMeetup) {
        return res.status(404).json({ ok: false, error: "약속 정보를 찾을 수 없습니다." });
      }

      // 약속 시간이 이미 지났는지 확인
      const appointmentTime = new Date(message.chatMeetup.appointmentTime);
      const now = new Date();
      
      if (appointmentTime < now) {
        return res.status(400).json({ 
          ok: false, 
          error: "past appointment: 이미 지난 약속에는 알림을 설정할 수 없습니다." 
        });
      }

      // 알림 끄기 요청인 경우
      if (disableAlarm) {
        // 기존 알림 설정 삭제
        await client.alarmSetting.deleteMany({
          where: {
            messageId: +messageId,
            userId: user.id
          }
        });

        return res.status(200).json({
          ok: true,
          disableAlarm: true,
          message: "알림이 해제되었습니다."
        });
      }

      // 알림 시간 검증
      if (!triggerAt) {
        return res.status(400).json({ ok: false, error: "알림 시간 정보가 누락되었습니다." });
      }

      const triggerAtDate = new Date(triggerAt);
      
      // 알림 시간이 현재보다 이전인지 확인
      if (triggerAtDate < now) {
        return res.status(400).json({ 
          ok: false, 
          error: "past alarm time: 설정하려는 알림 시간이 이미 지났습니다." 
        });
      }

      // 기존 설정 찾기
      const existingAlarmSetting = await client.alarmSetting.findFirst({
        where: {
          userId: user.id,
          messageId: +messageId
        }
      });

      let alarmSetting;

      if (existingAlarmSetting) {
        // 기존 설정 업데이트
        alarmSetting = await client.alarmSetting.update({
          where: {
            id: existingAlarmSetting.id
          },
          data: {
            alarmTime,
            triggerAt: triggerAtDate,
            isTriggered: false,
            chatMeetupId: message.chatMeetup!.id
          }
        });
      } else {
        // 새로운 설정 생성
        alarmSetting = await client.alarmSetting.create({
          data: {
            userId: user.id,
            messageId: +messageId,
            alarmTime,
            triggerAt: triggerAtDate,
            chatRoomId: +id,
            isTriggered: false,
            chatMeetupId: message.chatMeetup!.id
          }
        });
      }
      
      // 스케줄러에 등록
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || `https://${req.headers.host}`;
      await scheduleNewAlarm(alarmSetting.id, baseUrl);

      return res.status(200).json({
        ok: true,
        alarmSetting,
        alarmTime,
        message: `${alarmTime} 알림이 설정되었습니다.`
      });
      
    } catch (error) {
      console.error("알림 설정 중 오류 발생:", error);
      return res.status(500).json({
        ok: false,
        error: "서버 오류가 발생했습니다."
      });
    }
  }

  // GET 요청 처리 - 알림 설정 정보 조회
  if (req.method === "GET") {
    // 구현 필요시 추가...
  }

  // 허용되지 않은 메서드
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}

export default withApiSession(
  withHandler({
    methods: ["POST", "GET"],
    handler,
    isPrivate: true
  })
);
