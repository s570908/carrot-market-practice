import { NextApiRequest } from 'next';
import client from "@libs/client/client";
import { withApiSession } from '@libs/server/withSession';
import withHandler from '@libs/server/withHandler';
import { NextApiResponseServerIo } from '@/types/types';
import { sendPushNotification } from '@libs/server/pushService';
import { AlarmStatus } from '@prisma/client';

async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      error: 'Method not allowed' 
    });
  }
  
  try {
    const { alarmId } = req.body;
    
    if (!alarmId || isNaN(Number(alarmId))) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Valid alarmId is required' 
      });
    }
    
    // 더 상세한 알림 정보 조회 ([id].ts와 동일한 수준)
    const alarm = await client.alarmSetting.findUnique({
      where: { id: Number(alarmId) },
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
      return res.status(404).json({ 
        ok: false, 
        error: 'Alarm not found' 
      });
    }

    // 상태 확인 (스케줄러 호출이므로 SCHEDULED 상태만 처리)
    if (alarm.status !== 'SCHEDULED') {
      return res.status(400).json({ 
        ok: false, 
        error: `Alarm is already ${alarm.status}. Only SCHEDULED alarms can be triggered.` 
      });
    }

    // 알림 상태를 SENT로 업데이트
    const updatedAlarm = await client.alarmSetting.update({
      where: { id: Number(alarmId) },
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
      const pushPayload = {
        title: '약속 알림',
        body: meetup 
          ? `약속 ${alarm.alarmTime} 전입니다: ${meetup.place}` 
          : `약속 ${alarm.alarmTime} 전입니다`,
        icon: '/icons/soy-bean-192-192.png', // 일관된 아이콘 사용
        badge: '/icons/soy-bean-192-192.png', // 일관된 아이콘 사용
        data: {
          url: chatRoom ? `/chats/${chatRoom.id}` : '/',
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
          
          const result = await sendPushNotification(pushConfig, pushPayload);
          
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
    
    // [id].ts와 유사한 상세한 응답 형식
    return res.status(200).json({ 
      ok: true,
      success: true,
      message: `Alarm triggered successfully at ${new Date().toISOString()}`,
      alarmId: alarm.id,
      pushSent,
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
      pushResults // 상세 결과도 포함
    });
  } catch (error) {
    console.error('Error triggering alarm:', error);
    return res.status(500).json({ 
      ok: false,
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["POST"], handler, isPrivate: false })
);

/*
이 파일의 기능 요약

1. HTTP 메서드 검증 (POST만 허용)
2. alarmId 유효성 검사 (숫자 여부 확인)
3. 상세한 알림 정보 조회 (user, sellerChat, chatRoom, product, chatMeetup 포함)
4. 알림 존재 여부 및 상태 확인 (SCHEDULED 상태만 처리)
5. 알림 상태를 SENT로 업데이트
6. 사용자의 모든 푸시 구독 정보 조회 (다중 기기 지원)
7. 푸시 알림 페이로드 구성
8. 모든 구독에 대해 푸시 알림을 개별 전송하고 결과 집계
9. 상세한 응답 반환 (알림 정보, 푸시 전송 통계, 개별 결과)
10. 구체적인 에러 메시지와 상태 코드 반환

주요 특징:
- 자동 트리거 방식 (스케줄러에서 호출)
- Body로 alarmId 전달 (POST /api/alarm/trigger)
- 다중 기기 푸시 알림 지원
- 성공/실패 개별 추적 및 상세 통계 제공
- 상태 검증 및 에러 처리 강화
- 인증 없음 (스케줄러 내부 호출용)
- [id].ts와 일관된 응답 형식

사용 예:
POST /api/alarm/trigger
Body: { alarmId: 123 }
- 스케줄러가 알림 ID 123을 자동으로 트리거
- 권한 확인 없이 알림 처리
- 푸시 알림 전송 및 상태 업데이트
*/
