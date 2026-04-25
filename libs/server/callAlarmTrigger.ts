import client from "@/libs/client/client";
import { sendPushNotification } from "@/libs/server/pushService";
import { AlarmStatus } from "@prisma/client";

interface CallAlarmTriggerParams {
  baseUrl: string;
  alarmId: number;
  sessionCookie?: string;
  expectedTriggerAt?: string;
  flowId?: string;
}

/**
 * 서버 내부에서 직접 알람을 트리거하는 일반 함수 (API 핸들러 아님)
 * @param params 알람 트리거 파라미터
 * @returns 푸시 결과 등
 */
export async function callAlarmTrigger({
  baseUrl,
  alarmId,
  expectedTriggerAt,
  flowId,
}: CallAlarmTriggerParams) {
  console.log("[alarm-trigger] start", {
    baseUrl,
    alarmId,
    expectedTriggerAt,
    flowId,
  });

  // 알림 정보 조회
  const alarm = await client.alarmSetting.findUnique({
    where: { id: alarmId },
    include: {
      user: true,
      // sellerChat: {
      //   include: {
      //     chatRoom: {
      //       include: {
      //         product: true
      //       }
      //     }
      //   }
      // },
      // chatMeetup: true
    }
  });

  if (!alarm) {
    console.log("[alarm-trigger] skipped_not_found", {
      alarmId,
      flowId,
      expectedTriggerAt,
    });
    return {
      ok: true,
      skipped: true,
      reason: "alarm_not_found",
      alarm: null,
    };
  }

  if (
    expectedTriggerAt &&
    alarm.triggerAt.toISOString() !== expectedTriggerAt
  ) {
    console.log("[alarm-trigger] stale_job_skipped", {
      alarmId,
      flowId,
      expectedTriggerAt,
      currentTriggerAt: alarm.triggerAt.toISOString(),
      status: alarm.status,
    });
    return {
      ok: true,
      skipped: true,
      reason: "triggerAt_mismatch",
      alarm: {
        id: alarm.id,
        status: alarm.status,
        triggerAt: alarm.triggerAt.toISOString(),
      },
    };
  }

  // 상태 확인
  if (alarm.status !== 'SCHEDULED') {
    console.log("[alarm-trigger] skipped_non_scheduled", {
      alarmId,
      flowId,
      status: alarm.status,
      triggerAt: alarm.triggerAt.toISOString(),
    });
    return {
      ok: true,
      skipped: true,
      reason: `status_${alarm.status}`,
      alarm: {
        id: alarm.id,
        status: alarm.status,
        triggerAt: alarm.triggerAt.toISOString(),
      },
    };
  }

  // 여전히 현재 유효한 스케줄인 경우에만 SENT로 전이
  const sentUpdateResult = await client.alarmSetting.updateMany({
    where: {
      id: alarmId,
      status: AlarmStatus.SCHEDULED,
      ...(expectedTriggerAt
        ? { triggerAt: new Date(expectedTriggerAt) }
        : {}),
    },
    data: {
      status: AlarmStatus.SENT,
      updatedAt: new Date(),
    },
  });

  if (sentUpdateResult.count === 0) {
    console.log("[alarm-trigger] skipped_conditional_update_failed", {
      alarmId,
      flowId,
      expectedTriggerAt,
      currentTriggerAt: alarm.triggerAt.toISOString(),
      currentStatus: alarm.status,
    });
    return {
      ok: true,
      skipped: true,
      reason: "conditional_update_failed",
      alarm: {
        id: alarm.id,
        status: alarm.status,
        triggerAt: alarm.triggerAt.toISOString(),
      },
    };
  }

  // 푸시 알림 페이로드 구성을 위한 변수 정의
  // chatRoom과 meetup을 alarm.chatRoomId로 직접 조회
  const chatRoom = await client.chatRoom.findUnique({
    where: { id: alarm.chatRoomId },
    include: { product: true },
  });

  const meetup = await client.chatMeetup.findFirst({
    where: { chatRoomId: alarm.chatRoomId },
  });

  // 사용자의 푸시 구독 정보 조회 (ACTIVE만 대상으로)
  const subscriptions = await client.pushSubscription.findMany({
    where: { userId: alarm.userId, status: 'ACTIVE' }
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

    // 모든 활성 구독에 대해 푸시 알림 전송
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

          // 구독 상태가 ACTIVE가 아닌 경우 (예: "expired", "inactive", "invalid")
          if (
            result.error === "expired" ||
            result.error === "inactive" ||
            result.error === "invalid" ||
            result.error === "subscription not found in database"
          ) {
            // 이미 비활성화된 상태 또는 DB에 없는 구독이므로 추가 DB 업데이트/삭제 불필요
            console.log(`Subscription ${subscription.id} status: ${result.error}, skipping DB update.`);
            
            // inactive/invalid 상태의 구독을 자동 정리하려면:
            // (선택사항) AUTO_DELETE_INACTIVE_SUBSCRIPTIONS 환경변수가 true일 때만 삭제
            if (process.env.AUTO_DELETE_INACTIVE_SUBSCRIPTIONS === 'true') {
              await client.pushSubscription.delete({
                where: { id: subscription.id }
              });
              console.log(`Subscription ${subscription.id} (${result.error}) automatically deleted.`);
            }
          }
          // 410 Gone 등 네트워크/FCM 만료 에러 발생 시 구독 상태를 즉시 EXPIRED로 업데이트
          else if (
            result.error &&
            (
              result.error.includes('410') ||
              result.error.includes('unsubscribed') ||
              result.error === 'Received unexpected response code'
            )
          ) {
            // 자동 삭제 옵션이 활성화된 경우 바로 삭제
            if (process.env.AUTO_DELETE_EXPIRED_SUBSCRIPTIONS === 'true') {
              await client.pushSubscription.delete({
                where: { id: subscription.id }
              });
              console.log(`Subscription ${subscription.id} automatically deleted due to FCM 410 Gone.`);
            } else {
              // 구독을 EXPIRED로 마킹
              await client.pushSubscription.update({
                where: { id: subscription.id },
                data: { status: 'EXPIRED' }
              });
              console.log(`Subscription ${subscription.id} marked as EXPIRED due to FCM error.`);
            }
          }
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
        // 🔴 중복 제거: catch 블록에서는 상태 업데이트하지 않음 (위에서 이미 처리됨)
      }
    }
  }

  // 상세 결과는 유지하되, reasons 배열은 고유 항목으로 요약
  const uniqueReasons = [...new Set(reasons)];
  const reasonsSummary = uniqueReasons.map(reason => {
    const count = reasons.filter(r => r === reason).length;
    return `${reason} (${count}건)`;
  });

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
      reasonsSummary,  // 요약된 실패 사유
      totalSubscriptions: subscriptions.length,
      // 앞쪽에 있는 activeSubscriptions 배열 길이 참조
      totalActiveSubscriptions: subscriptions.filter(sub => sub.status === 'ACTIVE').length
    },
    // 상세 결과는 디버깅에 필요할 경우만 활성화
    pushResults: process.env.NODE_ENV === 'development' ? pushResults : undefined
  };

  console.log("[alarm-trigger] sent", {
    alarmId,
    flowId,
    expectedTriggerAt,
    pushSent,
    sentCount,
    failedCount,
  });
  return result;
}
