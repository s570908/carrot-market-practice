import schedule from 'node-schedule';
import client from "@/libs/client/client";
import dayjs from 'dayjs';
import { AlarmStatus, ChatMeetup } from "@prisma/client";
import { triggerAlarm } from '@/apiLibs/alarm';
//import { triggerAlarm, TriggerAlarmParams } from '@/apiLibs/alarm';

// 활성 작업 추적을 위한 Map (job ID => scheduled job)
const activeJobs = new Map();

export async function loadAlarms(baseUrl: string) {
  console.log('Loading and scheduling alarms...');
  
  try {
    // AlarmSetting에서 미래 알람 불러오기 (alarmTime: { not: null }은 Prisma 4+에서만 지원)
    // 만약 Prisma 버전이 낮아서 오류가 난다면 아래와 같이 두 단계로 분리
    const alarmsRaw = await client.alarmSetting.findMany({
      where: {
        status: AlarmStatus.SCHEDULED,
        triggerAt: { gt: new Date() },
      },
      include: { chatMeetup: true },
    });
    // Prisma의 include 옵션을 사용하면 반환 객체에 chatMeetup 등 관계 필드가 추가됨
    // 하지만 alarmSetting의alarmTime은 루트에 있으므로, filter는 alarm.alarmTime !== null로 사용
    const alarms = alarmsRaw.filter(alarm => (alarm as any).alarmTime !== null);

    // 만약 위에서 오류가 난다면 아래처럼 사용하세요:
    // const alarmsRaw = await client.alarmSetting.findMany({
    //   where: {
    //     status: AlarmStatus.SCHEDULED,
    //     triggerAt: { gt: new Date() },
    //   },
    //   include: { chatMeetup: true },
    // });
    // const alarms = alarmsRaw.filter(alarm => alarm.alarmTime !== null);

    console.log(`Found ${alarms.length} upcoming alarms to schedule`);
    
    // 각 알람 예약 설정
    alarms.forEach(alarm => {
      if ((alarm as any).alarmTime) {
        // 명시적으로 AlarmWithMeetup 타입으로 매핑
        const alarmWithMeetup: AlarmWithMeetup = {
          id: alarm.id,
         alarmTime: (alarm as any).alarmTime,
          status: alarm.status,
          triggerAt: alarm.triggerAt,
          chatMeetup: alarm.chatMeetup,
        };
        scheduleAlarm(alarmWithMeetup, baseUrl);
      }
    });
    
    return alarms.length;
  } catch (error) {
    console.error('Error loading alarms:', error);
    return 0;
  }
}

interface AlarmWithMeetup {
  id: number;
 alarmTime: string;
  status: AlarmStatus;
  triggerAt: Date;
  chatMeetup: ChatMeetup | null;
}

/*
scheduleAlarm 함수의 기능 요약

1. 입력받은 alarm 객체의alarmTime이 없으면 아무 작업도 하지 않음.
2. 이미 같은 alarm.id로 예약된 작업이 있으면 기존 작업을 취소함.
3. node-schedule을 사용해 alarm.triggerAt 시각에 실행될 작업을 예약함.
   - 예약된 시각이 되면:
     a. 해당 알람의 DB 상태를 SENT로 업데이트
     b. 관련 정보(chatMeetup, user 등)도 함께 조회
     c. 외부 API(/api/alarm/trigger)에 alarmId를 POST로 전달하여 알림 트리거
     d. 성공/실패 로그 출력
     e. 작업 완료 후 activeJobs Map에서 해당 작업을 제거
4. 새로 예약된 작업을 activeJobs Map에 저장하여 추적함.
5. 예약 완료 로그를 출력함.
*/

export function scheduleAlarm(alarm: AlarmWithMeetup, baseUrl: string) {
  if (!alarm.alarmTime) return; //alarmTime 없으면 스케줄링하지 않음
  
  // 기존 작업이 있다면 취소
  if (activeJobs.has(alarm.id)) {
    activeJobs.get(alarm.id).cancel();
  }

  console.log(`job = schedule.scheduleJob 수행전. Scheduling alarm ID ${alarm.id} for ${alarm.triggerAt.toISOString()}`);
  
  // 정확한 시간에 작업 예약
  const job = schedule.scheduleJob(alarm.triggerAt, async function() {
    try {
      console.log(`Triggering alarm ID: ${alarm.id} at ${new Date().toISOString()}`);
      
      // AlarmSetting 업데이트: status를 SENT로 변경 (isTriggered 제거)
      const updatedAlarm = await client.alarmSetting.update({
        where: { id: alarm.id },
        data: { status: AlarmStatus.SENT }, // enum 사용
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
      // 아래 코드는 예약된 알람이 트리거되는 시점에 서버의 /api/alarm/trigger 엔드포인트로 HTTP POST 요청을 보냅니다.
      // 이 요청의 목적은 실제 알림(푸시 등)을 사용자에게 발송하는 트리거 역할을 하며,
      // alarmId를 포함한 JSON 데이터를 서버에 전달합니다.
      // 서버는 이 alarmId를 바탕으로 알람 정보를 조회하고, 알림 전송 및 상태 업데이트 등의 후속 처리를 수행합니다.
      await triggerAlarm({ baseUrl, alarmId: alarm.id });
      
      console.log(`Alarm triggered successfully`);
      
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

// scheduleAlarmById 함수의 알고리즘 요약 (기존 scheduleAlarmById에서 이름 변경)
/*
1. alarmId로 알람 정보를 DB에서 조회 (chatMeetup 포함)
2. 아래 조건을 모두 만족하는지 확인:
   - 알람이 존재함
   -alarmTime이 있음
   - 상태가 SCHEDULED임
   - triggerAt이 미래 시점임
   - chatMeetup이 존재함
3. 조건을 모두 만족하면:
   - AlarmWithMeetup 객체로 변환
   - scheduleAlarm(alarmWithMeetup, baseUrl) 호출하여 실제 스케줄링
   - true 반환
4. 조건을 만족하지 않으면 false 반환
*/
export async function scheduleAlarmById(alarmId: number, baseUrl: string) {
  const alarm = await client.alarmSetting.findUnique({
    where: { id: alarmId },
    include: { chatMeetup: true },
  });
  console.log(`Scheduling alarm by ID: ${alarmId}`, alarm);
  if (
    alarm &&
    (alarm as any).alarmTime &&
    alarm.status === AlarmStatus.SCHEDULED &&
    alarm.triggerAt > new Date()
  ) {
    if (!alarm.chatMeetup) {
      console.warn(`Alarm ID ${alarm.id} does not have a related chatMeetup. Skipping scheduling.`);
      return false;
    }
    const alarmWithMeetup: AlarmWithMeetup = {
      id: alarm.id,
     alarmTime: (alarm as any).alarmTime,
      status: alarm.status,
      triggerAt: alarm.triggerAt,
      chatMeetup: alarm.chatMeetup,
    };

    console.log(`scheduleAlarm 직전: Scheduling alarm with meetup: ${JSON.stringify(alarmWithMeetup)}`);
    scheduleAlarm(alarmWithMeetup, baseUrl);
    return true;
  }
  return false;
}

// 기존 알람 취소 함수 (새로 추가)
export async function cancelExistingAlarm(alarmId: number) {
  try {
    // DB 상태 확인 후 메모리에서 제거
    const alarm = await client.alarmSetting.findUnique({
      where: { id: alarmId },
      select: { id: true, status: true }
    });

    // 이미 취소되었거나 전송된 알람은 스킵
    if (!alarm || alarm.status !== AlarmStatus.SCHEDULED) {
      console.log(`Alarm ID ${alarmId} is not in SCHEDULED status, skipping cancellation`);
      return true;
    }

    // 스케줄된 작업 취소
    if (activeJobs.has(alarmId)) {
      activeJobs.get(alarmId).cancel();
      activeJobs.delete(alarmId);
      console.log(`Cancelled scheduled job for alarm ID: ${alarmId}`);
    }
    
    // DB에서 알람 상태 업데이트
    await client.alarmSetting.update({
      where: { id: alarmId },
      data: { status: AlarmStatus.CANCELED }
    });
    
    return true;
  } catch (error) {
    console.error(`Error cancelling alarm ID ${alarmId}:`, error);
    return false;
  }
}

// 서버 시작 시 기존 스케줄 복구 로직
export async function initializeAlarmScheduler(baseUrl: string) {
  console.log('Initializing alarm scheduler...');
  
  try {
    // 서버 재시작 시 기존의 SCHEDULED 상태 알람들을 다시 스케줄링
    const scheduledAlarms = await client.alarmSetting.findMany({
      where: {
        status: AlarmStatus.SCHEDULED,
        triggerAt: { gt: new Date() } // 미래의 알람만
      },
      include: { chatMeetup: true }
    });

    console.log(`Found ${scheduledAlarms.length} alarms to reschedule`);
    
    for (const alarm of scheduledAlarms) {
      if ((alarm as any).alarmTime) {
        const alarmWithMeetup: AlarmWithMeetup = {
          id: alarm.id,
          alarmTime: (alarm as any).alarmTime,
          status: alarm.status,
          triggerAt: alarm.triggerAt,
          chatMeetup: alarm.chatMeetup,
        };
        scheduleAlarm(alarmWithMeetup, baseUrl);
      }
    }
    
    return scheduledAlarms.length;
  } catch (error) {
    console.error('Error initializing alarm scheduler:', error);
    return 0;
  }
}

/*
에러 분석: "chatMeetupId를 찾을 수 없습니다"

문제 상황:
1. 시스템 메시지: "약속시간 10분 전에 알림이 울릴 거예요"
2. 알림설정버튼 클릭 시 에러 발생
3. 에러 내용: chatMeetupId를 찾을 수 없음
4. 메타 데이터: {type: 'APPOINTMENT_ALERT', id: 102}

원인 분석:
1. APPOINTMENT_ALERT 타입의 시스템 메시지는 알림 설정 정보를 담고 있어야 함
2. 하지만 실제로는 chatMeetupId가 아닌 다른 id(102)가 저장되어 있음
3. 이는 시스템 메시지 생성 시 메타데이터 구조에 문제가 있음을 의미

해결 방안:
시스템 메시지 생성 부분에서 올바른 메타데이터를 설정해야 함
*/

// 이 문제는 약속 생성 시 APPOINTMENT_ALERT 메시지의 메타데이터 구조 문제입니다.
// pages/appointment/create.tsx에서 다음과 같이 수정이 필요합니다:

/*
현재 문제가 되는 코드 (추정):
const appointmentAlertInfo = SYSTEM_MESSAGES.APPOINTMENT_ALERT(
  responseData.chatMeetup.alarmTime, 
  responseData.chatMeetup.id  // 이 부분이 잘못된 것 같음
);

올바른 코드:
const appointmentAlertInfo = SYSTEM_MESSAGES.APPOINTMENT_ALERT(
  responseData.chatMeetup.alarmTime, 
  responseData.chatMeetup.id,
  responseData.message.id  // messageId도 포함해야 함
);

또는 SYSTEM_MESSAGES.APPOINTMENT_ALERT 함수 자체를 수정해야 할 수 있음:
- type: 'APPOINTMENT_ALERT'
- chatMeetupId: actual_chatmeetup_id
- messageId: message_id
- alarmTime: alarm_time
*/

// Prisma의 타입 시스템은 include 옵션을 사용하면 반환 타입을
// { chatMeetup: ... } & AlarmSetting 형태로 만듭니다.
// 하지만 실제 런타임 객체에는 alarm.alarmTime(알람 설정의 컬럼)이 항상 존재합니다.
// 타입스크립트는 타입 추론상 alarm.alarmTime이 없다고 생각할 수 있으나,
// 실제로는 alarm.alarmTime이 포함되어 있으므로 (alarm as any).alarmTime으로 접근하면 런타임에서 안전하게 동작합니다.

// activeJobs.get(alarmId).cancel() 및 activeJobs.delete(alarmId)의 의미:

// 1. activeJobs는 Map 객체로, 현재 스케줄된 알람 작업들을 메모리에서 추적합니다
// 2. activeJobs.get(alarmId)는 해당 알람 ID에 대응하는 node-schedule Job 객체를 가져옵니다
// 3. .cancel()은 node-schedule의 Job 메소드로, 예약된 작업을 취소합니다
// 4. activeJobs.delete(alarmId)는 Map에서 해당 알람 ID 엔트리를 제거합니다

/*
예시:
- 알람 ID 123이 "2024-01-15 14:00"에 실행되도록 스케줄되어 있음
- activeJobs에는 { 123 => Job객체 } 형태로 저장됨
- cancel() 호출 시: node-schedule에서 해당 시간에 실행될 작업이 취소됨
- delete() 호출 시: activeJobs Map에서 123번 엔트리가 제거됨

이렇게 하는 이유:
1. 메모리 누수 방지 (완료/취소된 작업은 Map에서 제거)
2. 중복 스케줄링 방지 (같은 알람을 여러 번 스케줄하지 않음)
3. 정확한 작업 상태 관리 (어떤 알람이 현재 활성화되어 있는지 추적)
*/


