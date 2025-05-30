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
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { alarmId } = req.body;
    
    if (!alarmId) {
      return res.status(400).json({ error: 'alarmId is required' });
    }
    
    // AlarmSetting 조회 및 상태 업데이트
    const alarm = await client.alarmSetting.update({
      where: { id: alarmId },
      data: { status: AlarmStatus.SENT },
      include: {
        chatMeetup: {
          include: {
            message: {
              include: {
                chatRoom: true
              }
            }
          }
        },
        user: true,
      },
    });
    
    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    // 개인 알람이므로 푸시 알림만 전송 (FCM 사용 안함, 소켓 이벤트 없음)
    // const pushPayload = {
    //   title: '약속 알림',  // 푸시 알림의 제목 (굵은 글씨로 표시)
    //   body: `약속 ${alarm.alarmTime} 전입니다: ${alarm.chatMeetup?.place || '장소 미정'}`,  // 푸시 알림의 본문 내용
    //   icon: '/icons/soy-bean-512-512.png',  // 푸시 알림에 표시될 아이콘
    //   badge: '/icons/soy-bean-192-192.png',  // 앱 아이콘에 표시될 배지
    //   data: {
    //     url: `/chats/${alarm.chatRoomId}`,  // 푸시 클릭 시 이동할 URL
    //     appointmentId: alarm.chatMeetupId   // 추가 데이터 (약속 ID)
    //   }
    // };
    
    let pushSent = false;
    try {
      const pushPayload = {
        title: '약속 알림',
        body: `약속 ${alarm.alarmTime} 전입니다: ${alarm.chatMeetup?.place || '장소 미정'}`,
        icon: '/icons/soy-bean-512-512.png',
        badge: '/icons/soy-bean-192-192.png',
        data: {
          url: `/chats/${alarm.chatRoomId}`,
          appointmentId: alarm.chatMeetupId
        },
        requireInteraction: true // 사용자가 액션을 취할 때까지 알림이 사라지지 않음
      };
      const pushResult = await sendPushNotification(alarm.userId, pushPayload);
      // 반환값이 객체라면 sent 프로퍼티만 추출
      pushSent = typeof pushResult === 'object' && pushResult !== null && 'sent' in pushResult
        ? Boolean((pushResult as any).sent)
        : Boolean(pushResult);
    } catch (pushError) {
      console.error('Push notification failed:', pushError);
    }
    
    return res.status(200).json({ 
      success: true, 
      alarmId: alarm.id,
      pushSent,
      message: `Personal alarm triggered successfully at ${new Date().toISOString()}` 
    });
  } catch (error) {
    console.error('Error triggering alarm:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["POST"], handler, isPrivate: false })
);
