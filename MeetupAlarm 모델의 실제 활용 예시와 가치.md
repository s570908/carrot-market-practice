# MeetupAlarm 모델의 실제 활용 예시와 가치

`MeetupAlarm` 모델은 채팅 기반 약속 시스템에서 사용자별로 개인화된 알림을 관리하는 핵심 구성 요소입니다. 실제 사용 시나리오를 통해 이 모델의 가치를 설명해 드리겠습니다.

## 시나리오 1: 중고거래 약속 - 판매자와 구매자의 다른 알림 설정

### 관련 데이터:

**User 데이터:**
```
User {
  id: 101
  name: "김철수"  // 판매자
}

User {
  id: 102
  name: "이영희"  // 구매자
}
```

**ChatMeetup 데이터:**
```
ChatMeetup {
  id: 501
  appointmentTime: "2023-06-15T14:00:00Z"  // 오후 2시 약속
  place: "강남역 2번 출구"
  messageId: 1001  // 관련 채팅 메시지 ID
}
```

**MeetupAlarm 데이터:**
```
MeetupAlarm {
  id: 701
  chatMeetupId: 501
  userId: 101  // 김철수(판매자)
  alarmTime: "30분 전"
  triggerAt: "2023-06-15T13:30:00Z"  // 약속 30분 전
  isTriggered: false
}

MeetupAlarm {
  id: 702
  chatMeetupId: 501
  userId: 102  // 이영희(구매자)
  alarmTime: "1시간 전"
  triggerAt: "2023-06-15T13:00:00Z"  // 약속 1시간 전
  isTriggered: false
}
```

### 설명:
이 예시에서는 같은 약속에 대해 판매자와 구매자가 각자 다른 시간에 알림을 받도록 설정했습니다. 판매자는 30분 전, 구매자는 1시간 전에 알림을 받습니다. `MeetupAlarm` 모델은 개인별 선호도에 따른 알림 설정을 가능하게 합니다.

## 시나리오 2: 단일 사용자의 여러 알림 설정

### 관련 데이터:

**User 데이터:**
```
User {
  id: 103
  name: "박민준"
}
```

**ChatMeetup 데이터:**
```
ChatMeetup {
  id: 502
  appointmentTime: "2023-06-16T10:00:00Z"  // 오전 10시 약속
  place: "홍대입구역 3번 출구"
  messageId: 1002
}
```

**MeetupAlarm 데이터:**
```
MeetupAlarm {
  id: 703
  chatMeetupId: 502
  userId: 103
  alarmTime: "1일 전"
  triggerAt: "2023-06-15T10:00:00Z"  // 하루 전 같은 시간
  isTriggered: false
}

MeetupAlarm {
  id: 704
  chatMeetupId: 502
  userId: 103
  alarmTime: "1시간 전"
  triggerAt: "2023-06-16T09:00:00Z"  // 1시간 전
  isTriggered: false
}
```

### 설명:
이 예시에서는 한 사용자가 동일한 약속에 대해 여러 알림을 설정했습니다. 하루 전과 한 시간 전, 두 번의 알림을 받습니다. `MeetupAlarm` 모델은 하나의 약속에 대해 다중 알림 설정을 지원합니다.

## 시나리오 3: 여러 약속에 대한 알림 관리

### 관련 데이터:

**User 데이터:**
```
User {
  id: 104
  name: "최수진"
}
```

**여러 ChatMeetup 데이터:**
```
ChatMeetup {
  id: 503
  appointmentTime: "2023-06-17T11:00:00Z"
  place: "신촌역 1번 출구"
  messageId: 1003
}

ChatMeetup {
  id: 504
  appointmentTime: "2023-06-18T15:30:00Z"
  place: "강남역 카페"
  messageId: 1004
}
```

**MeetupAlarm 데이터:**
```
MeetupAlarm {
  id: 705
  chatMeetupId: 503
  userId: 104
  alarmTime: "30분 전"
  triggerAt: "2023-06-17T10:30:00Z"
  isTriggered: false
}

MeetupAlarm {
  id: 706
  chatMeetupId: 504
  userId: 104
  alarmTime: "1시간 전"
  triggerAt: "2023-06-18T14:30:00Z"
  isTriggered: false
}
```

### 설명:
이 예시에서는 한 사용자가 여러 다른 약속에 대한 알림을 관리합니다. `MeetupAlarm` 모델은 사용자의 여러 약속에 대한 알림을 효율적으로 관리할 수 있게 합니다.

## 시나리오 4: 알림 발송 후 상태 추적

### 관련 데이터:

**사용자와 ChatMeetup 데이터 (위와 동일)**

**알림 발송 전 MeetupAlarm:**
```
MeetupAlarm {
  id: 707
  chatMeetupId: 503
  userId: 104
  alarmTime: "10분 전"
  triggerAt: "2023-06-17T10:50:00Z"
  isTriggered: false
}
```

**알림 발송 후 업데이트된 MeetupAlarm:**
```
MeetupAlarm {
  id: 707
  chatMeetupId: 503
  userId: 104
  alarmTime: "10분 전"
  triggerAt: "2023-06-17T10:50:00Z"
  isTriggered: true  // 알림이 발송됨
}
```

### 설명:
이 예시는 알림이 발송된 후 상태가 추적되는 방식을 보여줍니다. `isTriggered` 필드가 `true`로 업데이트되어 중복 알림을 방지합니다.

## MeetupAlarm 모델의 가치

1. **개인화된 알림**: 사용자마다 자신의 선호에 맞는 알림 시간 설정 가능
2. **다중 알림 지원**: 하나의 약속에 대해 여러 시점의 알림 설정 가능
3. **정확한 알림 시간 계산**: `triggerAt` 필드로 정확한 알림 발송 시점 계산
4. **중복 알림 방지**: `isTriggered` 필드로 알림 상태 추적
5. **관계형 모델링**: `ChatMeetup`과 `User` 모델과의 관계를 통해 약속 및 사용자 정보에 쉽게 접근
6. **시스템 확장성**: 알림 유형 및 기능을 확장하기 쉬운 구조

이처럼 `MeetupAlarm` 모델은 채팅 기반 약속 시스템에서 정확하고 개인화된 알림을 제공하는 데 중요한 역할을 합니다.