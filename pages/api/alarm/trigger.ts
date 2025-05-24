import { NextApiRequest } from 'next';
import client from "@libs/client/client";
import { withApiSession } from '@libs/server/withSession';
import withHandler from '@libs/server/withHandler';
import { NextApiResponseServerIo } from '@/types/types';
import { sendPushNotification } from '@libs/server/pushService';

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
    
    // MeetupAlarm 대신 AlarmSetting을 조회 및 업데이트
    const alarm = await client.alarmSetting.update({
      where: { id: alarmId },
      data: { isTriggered: true },
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
    
    // 소켓 서버를 통해 알림 전송 (프라이버시 보호: 내 알람 트리거 사실은 남에게 알리지 않음)
    // 아래 코드를 제거 또는 주석 처리
    // if (res?.socket?.server?.io) {
    //   const chatRoomId = alarm.chatMeetup.message.chatRoomId;
    //   const roomName = `/ws-market-${chatRoomId}`;
      
    //   res.socket.server.io.of("ws-market").to(roomName).emit('alarm_notification', {
    //     type: 'APPOINTMENT_ALARM',
    //     userId: alarm.userId,
    //     appointmentTime: alarm.chatMeetup.appointmentTime,
    //     place: alarm.chatMeetup.place,
    //     alarmTime: alarm.alarmTime,
    //     message: `약속 ${alarm.alarmTime}입니다: ${alarm.chatMeetup.place}`
    //   });
    // }
    
    // 푸시 알림 전송
    const pushPayload = {
      title: '약속 알림',
      body: `약속 ${alarm.alarmTime}입니다: ${alarm.chatMeetup?.place || '장소 미정'}`,
      icon: '/icons/soy-bean-512-512.png', // 더 큰 아이콘 사용
      badge: '/icons/soy-bean-192-192.png', // 작은 아이콘을 배지로 사용
      data: {
        url: `/chats/${alarm.chatRoomId}`,
        appointmentId: alarm.chatMeetupId
      }
    };
    
    const pushSent = await sendPushNotification(alarm.userId, pushPayload);
    
    return res.status(200).json({ 
      success: true, 
      alarmId: alarm.id,
      pushSent,
      message: `Alarm triggered successfully at ${new Date().toISOString()}` 
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
