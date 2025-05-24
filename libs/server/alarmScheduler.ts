import schedule from 'node-schedule';
import client from "@/libs/client/client";
import axios from 'axios';
import dayjs from 'dayjs';

// 활성 작업 추적을 위한 Map (job ID => scheduled job)
const activeJobs = new Map();

export async function loadAlarms(baseUrl: string) {
  console.log('Loading and scheduling alarms...');
  
  try {
    // MeetupAlarm 대신 AlarmSetting에서 직접 미래 알람 불러오기
    const alarms = await client.alarmSetting.findMany({
      where: {
        isTriggered: false,
        triggerAt: {
          gt: new Date(), // 현재 시간 이후의 알람만
        },
      },
      include: {
        chatMeetup: true,
      },
    });

    console.log(`Found ${alarms.length} upcoming alarms to schedule`);
    
    // 각 알람 예약 설정
    alarms.forEach(alarm => {
      scheduleAlarm(alarm, baseUrl);
    });
    
    return alarms.length;
  } catch (error) {
    console.error('Error loading alarms:', error);
    return 0;
  }
}

export function scheduleAlarm(alarm: any, baseUrl: string) {
  // 기존 작업이 있다면 취소
  if (activeJobs.has(alarm.id)) {
    activeJobs.get(alarm.id).cancel();
  }
  
  // 정확한 시간에 작업 예약
  const job = schedule.scheduleJob(alarm.triggerAt, async function() {
    try {
      console.log(`Triggering alarm ID: ${alarm.id} at ${new Date().toISOString()}`);
      
      // AlarmSetting 업데이트
      const updatedAlarm = await client.alarmSetting.update({
        where: { id: alarm.id },
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

      // API 호출
      const response = await axios.post(`${baseUrl}/api/alarm/trigger`, {
        alarmId: alarm.id
      });
      
      console.log(`Alarm triggered successfully: ${JSON.stringify(response.data)}`);
      
      // 작업 완료 후 Map에서 제거
      activeJobs.delete(alarm.id);
    } catch (error) {
      console.error(`Error triggering alarm ID ${alarm.id}:`, error);
    }
  });
  
  // 활성 작업 Map에 추가
  activeJobs.set(alarm.id, job);
  
  const formattedTime = dayjs(alarm.triggerAt).format('YYYY-MM-DD HH:mm:ss');
  console.log(`Scheduled alarm ID ${alarm.id} for ${formattedTime}`);
}

// 새로운 알람이 설정되었을 때 호출되는 함수
export async function scheduleNewAlarm(alarmId: number, baseUrl: string) {
  try {
    // MeetupAlarm 대신 AlarmSetting 조회
    const alarm = await client.alarmSetting.findUnique({
      where: { id: alarmId },
      include: { chatMeetup: true },
    });
    
    if (alarm && !alarm.isTriggered && alarm.triggerAt > new Date()) {
      scheduleAlarm(alarm, baseUrl);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error scheduling new alarm ID ${alarmId}:`, error);
    return false;
  }
}
