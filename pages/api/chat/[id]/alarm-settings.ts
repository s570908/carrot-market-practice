import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { cancelExistingAlarm, scheduleAlarmById } from "@libs/server/alarmScheduler";
import { AlarmStatus } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { messageId, alarmTime, triggerAt, disableAlarm, isTestMode, forceTestMode } = req.body;
  const { user } = req.session;

  // 테스트 모드 로깅
  console.log("=====> 알람 설정 요청:", { 
    id, messageId, alarmTime, triggerAt, 
    isTestMode, forceTestMode,
    userId: user?.id 
  });

  // 공통 검증
  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  if (!id) {
    return res.status(400).json({ ok: false, error: "Chat room id is required" });
  }
  if (!messageId) {
    return res.status(400).json({ ok: false, error: "Alert message id is required" });
  }

  try {
    // 알림 메시지 조회 (시스템 메시지)
    const alertMessage = await client.sellerChat.findUnique({
      where: { id: +messageId }
    });

    console.log("=====> alertMessage:", alertMessage);

    if (!alertMessage) {
      return res.status(404).json({ 
        ok: false, 
        error: "Alert message not found" 
      });
    }

    // 메타데이터에서 chatMeetupId 추출
    let chatMeetupId;
    let metaIsTestMode = false;
    let virtualAppointment = null;
    
    try {
      const meta = typeof alertMessage.meta === 'string' 
        ? JSON.parse(alertMessage.meta) 
        : alertMessage.meta;
      chatMeetupId = meta?.chatMeetupId;
      metaIsTestMode = meta?.isTestMode === true;
      virtualAppointment = meta?.virtualAppointment || null;
      
      console.log("=====> meta 파싱 결과:", { 
        chatMeetupId, 
        metaIsTestMode, 
        virtualAppointment 
      });
    } catch (e) {
      console.error('메타데이터 파싱 오류:', e);
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid message metadata" 
      });
    }

    // 테스트 모드 확인 (메타데이터 또는 요청 본문에서)
    const isInTestMode = metaIsTestMode || isTestMode === true || forceTestMode === true;
    console.log("=====> 테스트 모드 여부:", isInTestMode);

    if (!chatMeetupId && !isInTestMode) {
      return res.status(400).json({ 
        ok: false, 
        error: "ChatMeetup ID not found in message metadata" 
      });
    }

    // 약속 메시지 조회 또는 가상 약속 생성
    let appointmentMessage = null;
    let fakeChatMeetup = null;

    if (!isInTestMode) {
      // 실제 모드: 약속 정보 조회
      appointmentMessage = await client.sellerChat.findFirst({
        where: {
          chatMeetup: {
            id: chatMeetupId
          }
        },
        include: { chatMeetup: true }
      });      

      //nsole.log("=========================> 약속 메시지 조회 결과:", appointmentMessage);

      if (!appointmentMessage?.chatMeetup) {
        console.error("=====> 약속 메시지 조회 실패:", { chatMeetupId });
        return res.status(404).json({ 
          ok: false, 
          error: "Appointment not found" 
        });
      }
    } else {
      // 테스트 모드: 가상 약속 데이터 생성
      console.log("=====> 테스트 모드 활성화: 가상 약속 데이터 생성");
      
      // 트리거 시간 계산 (triggerAt보다 10분 이후로 설정)
      const triggerDate = new Date(triggerAt);
      const futureAppointmentTime = new Date(triggerDate.getTime() + 10 * 60 * 1000);
      
      // 가상 약속 ID
      const fakeAppointmentId = virtualAppointment?.id || 999999;
      
      // 가상 ChatMeetup 생성
      fakeChatMeetup = {
        id: fakeAppointmentId,
        appointmentTime: virtualAppointment?.appointmentTime || futureAppointmentTime.toISOString(),
        place: virtualAppointment?.place || "가상 테스트 위치",
        locationLatitude: 37.5665,
        locationLongitude: 126.9780,
       alarmTime: alarmTime || "테스트 알림",
        messageId: +messageId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 가상 약속 메시지 생성
      appointmentMessage = {
        id: +messageId,
        chatMeetup: fakeChatMeetup
      };
      
      console.log("=====> 생성된 가상 약속 데이터:", appointmentMessage);
    }

    // POST 메소드 - 새로운 알림 생성
    if (req.method === "POST") {
      // 트리거 시간이 과거인지 체크
      const now = new Date();
      const triggerTime = new Date(triggerAt);
      
      console.log("=====> 시간 검증:", {
        now: now.toISOString(),
        triggerTime: triggerTime.toISOString(),
        isPast: triggerTime < now
      });
      
      if (triggerTime < now && !isInTestMode) {  // 테스트 모드에서는 과거 시간 허용
        return res.status(400).json({ 
          ok: false, 
          error: "Trigger time cannot be in the past" 
        });
      }

      if (!appointmentMessage.chatMeetup) {
        return res.status(400).json({ 
          ok: false, 
          error: "Appointment information is missing." 
        });
      }
      const appointmentTime = new Date(appointmentMessage.chatMeetup.appointmentTime);
      if (appointmentTime < now && !isInTestMode) {  // 테스트 모드에서는 과거 약속 허용
        return res.status(400).json({ 
          ok: false, 
          error: "past appointment: 이미 지난 약속에는 알림을 설정할 수 없습니다." 
        });
      }

      // 알림 비활성화 처리
      if (disableAlarm) {
        const result = await client.$transaction(async (tx) => {
          const existingAlarm = await tx.alarmSetting.findFirst({
            where: {
              messageId: +messageId,
              userId: user.id,
              status: AlarmStatus.SCHEDULED
            }
          });

          if (existingAlarm) {
            await tx.alarmSetting.update({
              where: { id: existingAlarm.id },
              data: { status: AlarmStatus.CANCELED }
            });
          }

          return { canceled: existingAlarm?.id, newAlarm: null };
        });

        if (result.canceled) {
          await cancelExistingAlarm(result.canceled);
        }

        return res.status(200).json({
          ok: true,
          alarmSetting: null,
          message: "Alarm canceled successfully",
          disableAlarm: true,
          alarmTime
        });
      }

      // 새로운 알림 생성
      const result = await client.$transaction(async (tx) => {
        // 기존 알람 설정 조회 및 취소
        const existingAlarm = await tx.alarmSetting.findFirst({
          where: {
            messageId: +messageId,
            userId: user.id,
            status: AlarmStatus.SCHEDULED
          }
        });

        if (existingAlarm) {
          await tx.alarmSetting.update({
            where: { id: existingAlarm.id },
            data: { status: AlarmStatus.CANCELED }
          });
        }

        // 새로운 알람 설정 생성
        const newAlarm = await tx.alarmSetting.create({
          data: {
            userId: user.id,
            chatRoomId: +id,
            messageId: +messageId,
            chatMeetupId: isInTestMode ? (fakeChatMeetup?.id || 999999) : (appointmentMessage.chatMeetup?.id ?? 999999),
            alarmTime,
            triggerAt: new Date(triggerAt),
            status: AlarmStatus.SCHEDULED
          }
        });
        return { canceled: existingAlarm?.id, newAlarm };
      });

      // 트랜잭션 외부에서 스케줄러 관리
      if (result.canceled) {
        await cancelExistingAlarm(result.canceled);
      }
      console.log("=====> 새 알람 생성 결과:", result.newAlarm);
      if (result.newAlarm) {
        // ✅ scheduleAlarmById를 사용하여 스케줄링 방식으로 통일
        // baseUrl 생성 부분 수정
        const isLocalhost = req.headers.host?.startsWith('localhost');
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          `${isLocalhost ? 'http' : 'https'}://${req.headers.host}`;
        console.log("=====> scheduleAlarmById 수행전, baseUrl: ", baseUrl);
        await scheduleAlarmById(result.newAlarm.id, baseUrl);
      }

      // 응답에 추가 정보 포함
      return res.status(200).json({
        ok: true,
        alarmSetting: result.newAlarm,
        message: "Alarm scheduled successfully",
        disableAlarm: false,
        alarmTime,
        isTestMode: isInTestMode,
        // 추가 상태 정보
        debug: {
          scheduledAt: new Date().toISOString(),
          triggerTime: new Date(triggerAt).toISOString(),
          timeUntilTrigger: Math.floor((new Date(triggerAt).getTime() - new Date().getTime()) / 1000) + "초",
          appointmentInfo: isInTestMode ? 
            { isVirtual: true, id: fakeChatMeetup?.id } : 
            { id: appointmentMessage.chatMeetup?.id }
        }
      });
    }

    // PUT 메소드 - 기존 알림 수정
    if (req.method === "PUT") {
      // 알림 비활성화 처리
      if (disableAlarm) {
        const result = await client.$transaction(async (tx) => {
          const existingAlarm = await tx.alarmSetting.findFirst({
            where: {
              messageId: +messageId,
              userId: user.id,
              status: AlarmStatus.SCHEDULED
            }
          });

          if (existingAlarm) {
            await tx.alarmSetting.update({
              where: { id: existingAlarm.id },
              data: { status: AlarmStatus.CANCELED }
            });
          }

          return { canceled: existingAlarm?.id, newAlarm: null };
        });

        if (result.canceled) {
          await cancelExistingAlarm(result.canceled);
        }

        return res.status(200).json({
          ok: true,
          alarmSetting: null,
          message: "Alarm disabled successfully",
          disableAlarm: true,
          alarmTime
        });
      }

      // 기존 알림 업데이트
      const result = await client.$transaction(async (tx) => {
        // 기존 알람 설정 조회 및 취소
        const existingAlarm = await tx.alarmSetting.findFirst({
          where: {
            messageId: +messageId,
            userId: user.id,
            status: AlarmStatus.SCHEDULED
          }
        });

        if (existingAlarm) {
          await tx.alarmSetting.update({
            where: { id: existingAlarm.id },
            data: { status: AlarmStatus.CANCELED }
          });
        }

        // upsert 방식으로 알람 설정 업데이트
        const updatedAlarm = await tx.alarmSetting.upsert({
          where: {
            messageId_userId: {
              messageId: +messageId,
              userId: user.id
            }
          },
          update: {
            chatMeetupId: appointmentMessage.chatMeetup!.id,
            alarmTime,
            triggerAt: new Date(triggerAt),
            status: AlarmStatus.SCHEDULED,
          },
          create: {
            userId: user.id,
            chatRoomId: +id,
            messageId: +messageId,
            chatMeetupId: appointmentMessage.chatMeetup!.id,
            alarmTime,
            triggerAt: new Date(triggerAt),
            status: AlarmStatus.SCHEDULED,
          }
        });

        return { canceled: existingAlarm?.id, newAlarm: updatedAlarm };
      });

      // 트랜잭션 외부에서 스케줄러 관리
      if (result.canceled) {
        await cancelExistingAlarm(result.canceled);
      }

      if (result.newAlarm) {
        // baseUrl 생성 부분 수정
        const isLocalhost = req.headers.host?.startsWith('localhost');
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          `${isLocalhost ? 'http' : 'https'}://${req.headers.host}`;
        await scheduleAlarmById(result.newAlarm.id, baseUrl);
      }

      return res.status(200).json({
        ok: true,
        alarmSetting: result.newAlarm,
        message: "Alarm updated successfully",
        disableAlarm: false,
        alarmTime
      });
    }

  } catch (error) {
    // 오류 로깅 개선
    console.error(`Error ${req.method === "POST" ? "creating" : "updating"} alarm settings:`, error);
    // 상세 오류 정보 포함
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("오류 상세 정보:", { message: errorMessage, stack: errorStack });
    
    return res.status(500).json({ 
      ok: false, 
      error: "Internal server error",
      debug: process.env.NODE_ENV === "development" ? { message: errorMessage } : undefined
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["POST", "PUT"], handler })
);
