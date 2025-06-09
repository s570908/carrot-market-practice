import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { sendPushNotification } from "@libs/server/pushService";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = req.session;
    const { id } = req.query; // URL 파라미터에서 id 추출

    console.log("pages/api/alarm/trigger/[id].ts--요청된 알림 ID:", user, id);

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, error: "유효한 알림 ID가 필요합니다" });
    }

    const alarmId = Number(id);

    console.log("pages/api/alarm/trigger/[id].ts--알림 트리거 요청:", { userId: user.id, alarmId });

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
      return res.status(404).json({ ok: false, error: "알림을 찾을 수 없습니다" });
    }

    // 권한 확인 (알림 소유자만 트리거 가능)
    if (alarm.userId !== user.id) {
      return res.status(403).json({ ok: false, error: "이 알림을 트리거할 권한이 없습니다" });
    }

    // 이미 트리거된 알림인지 확인
    if (alarm.status !== 'SCHEDULED') {
      return res.status(400).json({ 
        ok: false, 
        error: `이미 ${alarm.status} 상태인 알림입니다. SCHEDULED 상태의 알림만 트리거할 수 있습니다.` 
      });
    }

    // 알림 상태를 SENT로 변경
    await client.alarmSetting.update({
      where: { id: alarmId },
      data: { 
        status: 'SENT',
        updatedAt: new Date()
      }
    });

    // 푸시 알림 페이로드 구성을 위한 변수 정의
    const chatRoom = alarm.sellerChat.chatRoom;
    const meetup = alarm.chatMeetup;

    // 사용자의 푸시 구독 정보 조회
    const subscriptions = await client.pushSubscription.findMany({
      where: { userId: user.id }
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
          url: `/chats/${chatRoom.id}`,
          alarmId: alarm.id,
          chatRoomId: chatRoom.id,
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
          console.error('Push notification failed for subscription:', subscription.id, pushError);
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

    return res.status(200).json({
      ok: true,
      message: `알림이 트리거되었습니다: ${new Date().toISOString()}`,
      alarm: {
        id: alarm.id,
        status: 'SENT',
        triggerTime: new Date().toISOString(),
        alarmTime: alarm.alarmTime,
        chatRoomId: chatRoom.id
      },
      pushResult: {
        sent: sentCount,
        failed: failedCount,
        reasons
      },
      pushResults // 상세 결과도 포함
    });

  } catch (error) {
    console.error("수동 알림 트리거 오류:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "서버 오류가 발생했습니다",
      details: error instanceof Error ? error.message : "알 수 없는 오류"
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["POST"], handler })
);

/*
이 파일의 기능 요약 (URL 라우트용)

1. URL 파라미터에서 알림 ID 추출 (/api/alarm/trigger/123 → id = "123")
2. 로그인된 사용자인지 확인 (세션 검사)
3. 알림 ID 유효성 검사 (숫자 여부 확인)
4. 해당 알림(alarmSetting) 정보를 DB에서 조회 (user, sellerChat, chatRoom, chatMeetup 포함)
5. 알림이 존재하는지, 요청자가 알림 소유자인지, 알림 상태가 SCHEDULED인지 확인
6. 알림 상태를 SENT로 업데이트
7. 사용자의 모든 푸시 구독 정보 조회 (여러 기기 지원)
8. 푸시 알림 페이로드를 구성 (약속 장소, 채팅방 등 정보 포함)
9. 모든 구독에 대해 푸시 알림을 개별 전송하고 결과 집계
10. 결과(알림 정보, 푸시 전송 통계)를 JSON으로 반환
11. 오류 발생 시 적절한 에러 메시지와 함께 4xx/5xx 응답 반환

주요 특징:
- 수동 트리거 방식 (사용자가 직접 호출)
- URL 라우트 지원 (POST /api/alarm/trigger/{id})
- 다중 기기 푸시 알림 지원
- 성공/실패 개별 추적 및 통계 제공
- 권한 확인 및 상태 검증
- 세션 기반 인증 필요

사용 예:
POST /api/alarm/trigger/123
- 알림 ID 123을 수동으로 트리거
- 로그인한 사용자가 해당 알림의 소유자인지 확인
- 푸시 알림 전송 및 상태 업데이트
*/
