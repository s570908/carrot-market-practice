import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { sendPushNotification } from "@libs/server/pushService";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = req.session;
    const { id } = req.query;

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, error: "유효한 알림 ID가 필요합니다" });
    }

    const alarmId = Number(id);

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

    // 알림 상태를 TRIGGERED로 변경
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

    if (subscriptions.length > 0) {
      const payload = {
        title: "약속 알림 (수동 트리거)",
        body: meetup 
          ? `${meetup.place}에서의 약속 시간이 다가왔습니다` 
          : "설정된 알림이 발송되었습니다",
        icon: "/icons/soy-bean-192-192.png",
        badge: "/icons/soy-bean-192-192.png",
        data: {
          url: `/chats/${chatRoom.id}`,
          alarmId: alarm.id,
          chatRoomId: chatRoom.id,
          isManualTrigger: true,
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
        } catch (pushError) {
          console.error('Push notification failed for subscription:', subscription.id, pushError);
          failedCount++;
          reasons.push(pushError instanceof Error ? pushError.message : 'Unknown error');
        }
      }
    }

    return res.status(200).json({
      ok: true,
      message: "알림이 수동으로 트리거되었습니다",
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
      }
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
이 파일의 기능 요약 (수정됨)

1. 로그인된 사용자인지 확인 (세션 검사)
2. 쿼리 파라미터로 받은 알림 ID(id)가 유효한지 검사
3. 해당 알림(alarmSetting) 정보를 DB에서 조회 (user, sellerChat, chatRoom, chatMeetup 포함)
4. 알림이 존재하는지, 요청자가 알림 소유자인지, 알림 상태가 SCHEDULED인지 확인
5. 알림 상태를 SENT로 업데이트
6. 사용자의 모든 푸시 구독 정보 조회 (여러 기기 지원)
7. 푸시 알림 페이로드를 구성 (약속 장소, 채팅방 등 정보 포함, 수동 트리거 표시)
8. 모든 구독에 대해 푸시 알림을 개별 전송하고 결과 집계
9. 결과(알림 정보, 푸시 전송 통계)를 JSON으로 반환
10. 오류 발생 시 적절한 에러 메시지와 함께 4xx/5xx 응답 반환

주요 특징:
- 수동 트리거 방식 (사용자가 직접 호출)
- 다중 기기 푸시 알림 지원
- 성공/실패 개별 추적 및 통계 제공
- 권한 확인 및 상태 검증
*/
