import client from "@/libs/client/client";
import { sendPushNotification } from "@/libs/server/pushService";
import { AlarmStatus } from "@prisma/client";

interface CallAlarmTriggerParams {
  baseUrl: string;
  alarmId: number;
  sessionCookie?: string;
}

/**
 * 서버 내부에서 직접 알람을 트리거하는 일반 함수 (API 핸들러 아님)
 * @param params 알람 트리거 파라미터
 * @returns 푸시 결과 등
 */
export async function callAlarmTrigger({ baseUrl, alarmId}: CallAlarmTriggerParams) {
  console.log("callAlarmTrigger start:", { baseUrl, alarmId });

  // 알림 정보 조회
  const alarm = await client.alarmSetting.findUnique({
    where: { id: alarmId },
    include: {
      user: true,
      sellerChat: {
        include: {
          chatRoom: {
            include: {
              product: true
            }
          }
        }
      },
      chatMeetup: true
    }
  });

  if (!alarm) {
    throw new Error("알림을 찾을 수 없습니다");
  }

  // 상태 확인
  if (alarm.status !== 'SCHEDULED') {
    throw new Error(`이미 ${alarm.status} 상태인 알림입니다. SCHEDULED 상태의 알림만 트리거할 수 있습니다.`);
  }

  // 알림 상태를 SENT로 변경
  await client.alarmSetting.update({
    where: { id: alarmId },
    data: { 
      status: AlarmStatus.SENT,
      updatedAt: new Date()
    }
  });

  // 푸시 알림 페이로드 구성을 위한 변수 정의
  const chatRoom = alarm.sellerChat?.chatRoom;
  const meetup = alarm.chatMeetup;

  // 사용자의 푸시 구독 정보 조회
  const subscriptions = await client.pushSubscription.findMany({
    where: { userId: alarm.userId }
  });

  let pushSent = false;
  let sentCount = 0;
  let failedCount = 0;
  const reasons: string[] = [];
  const pushResults = [];

  if (subscriptions.length > 0) {
    const payload = {
      title: "약속 알림",
      body: meetup 
        ? `약속 ${alarm.alarmTime} 전입니다: ${meetup.place}` 
        : `약속 ${alarm.alarmTime} 전입니다`,
      icon: "/icons/soy-bean-192-192.png",
      badge: "/icons/soy-bean-192-192.png",
      data: {
        url: chatRoom ? `/chats/${chatRoom.id}` : "/",
        alarmId: alarm.id,
        chatRoomId: chatRoom?.id,
        appointmentId: meetup?.id,
        timestamp: new Date().getTime(),
      },
      requireInteraction: true
    };

    // 모든 구독에 대해 푸시 알림 전송
    for (const subscription of subscriptions) {
      try {
        const pushConfig = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };
        
        const result = await sendPushNotification(pushConfig, payload);
        
        if (result.success) {
          sentCount++;
          pushSent = true;
        } else {
          failedCount++;
          if (result.error) reasons.push(result.error);
        }
        
        pushResults.push({ ...result, subscriptionId: subscription.id });
      } catch (pushError) {
        failedCount++;
        const errorMessage = pushError instanceof Error ? pushError.message : 'Unknown error';
        reasons.push(errorMessage);
        pushResults.push({ 
          success: false, 
          error: errorMessage, 
          subscriptionId: subscription.id 
        });
      }
    }
  }

  const result = {
    ok: true,
    message: `알림이 트리거되었습니다: ${new Date().toISOString()}`,
    alarm: {
      id: alarm.id,
      status: 'SENT',
      triggerTime: new Date().toISOString(),
      alarmTime: alarm.alarmTime,
      chatRoomId: chatRoom?.id
    },
    pushResult: {
      sent: sentCount,
      failed: failedCount,
      reasons
    },
    pushResults
  };

  console.log("callAlarmTrigger result:", result);
  return result;
}
