# PWA 업데이트 API 명세서

## 1. 목적

앱이 실행되지 않은 동안 서버, DB, 클라이언트 코드가 함께 업데이트된 경우에도 사용자가 다음에 앱을 열었을 때 항상 최신 상태로 진입하게 하기 위한 API 규격을 정의한다.

이 문서는 다음 두 가지를 분리해서 다룬다.
- 현재 프로젝트에 이미 존재하는 push 관련 API
- 앱 재실행 시 버전/업데이트 여부를 판단하기 위해 추가하는 권장 API

---

## 2. 설계 원칙

- 앱이 꺼져 있는 동안에는 클라이언트가 동작하지 않으므로, 서버가 업데이트 판단의 기준이 된다.
- 버전 정보는 캐시되지 않도록 항상 최신 값을 조회한다.
- 데이터 업데이트와 클라이언트 코드 업데이트는 별도로 판단한다.
- 소프트 업데이트와 하드 업데이트를 구분한다.
- 푸시 알림은 앱이 꺼져 있는 동안 사용자에게 재진입을 유도하는 채널로 사용한다.

---

## 3. 공통 규약

### 3.1 공통 응답 형식

성공 응답 예시:

```json
{
  "ok": true,
  "data": {}
}
```

실패 응답 예시:

```json
{
  "ok": false,
  "error": "error message"
}
```

### 3.2 공통 헤더

- `Content-Type: application/json`
- 버전 확인용 API는 `Cache-Control: no-store` 권장
- 인증이 필요한 API는 세션 기반 인증 사용

### 3.3 상태 코드 정책

- `200 OK`: 정상 처리
- `400 Bad Request`: 요청 값 누락 또는 형식 오류
- `401 Unauthorized`: 로그인 필요
- `404 Not Found`: 대상 리소스 없음
- `405 Method Not Allowed`: 허용되지 않은 메서드
- `500 Internal Server Error`: 서버 내부 오류

---

## 4. 버전 게이트 API

이 파트는 현재 구현이 없으면 새로 추가하는 것을 권장한다.

### 4.1 GET /api/app/releases/latest

앱이 시작될 때 가장 먼저 호출하는 버전 확인 API다.

#### 목적

- 현재 배포된 최신 앱 버전 확인
- 최소 지원 버전 확인
- 강제 업데이트 여부 확인
- 릴리스 노트 제공

#### 인증

- 비로그인 사용자도 호출 가능
- 단, 사용자 맞춤 릴리스가 필요하면 로그인 기반 확장 가능

#### 요청 예시

```http
GET /api/app/releases/latest
```

#### 응답 예시

```json
{
  "ok": true,
  "data": {
    "version": "1.8.0",
    "buildId": "2026.05.16-01",
    "releasedAt": "2026-05-16T09:00:00.000Z",
    "releaseType": "hotfix",
    "minSupportedVersion": "1.6.0",
    "forceUpdate": false,
    "title": "버그 수정 및 성능 개선",
    "message": "앱 안정성이 개선되었습니다.",
    "changelogUrl": "/releases/1.8.0",
    "maintenance": {
      "enabled": false,
      "message": null,
      "retryAfterSeconds": null
    }
  }
}
```

#### 필드 정의

- `version`: 현재 최신 앱 버전
- `buildId`: 배포 빌드 식별자
- `releasedAt`: 배포 시각
- `releaseType`: `major`, `minor`, `patch`, `hotfix`
- `minSupportedVersion`: 이 버전 미만은 사용 차단
- `forceUpdate`: 즉시 업데이트 강제 여부
- `title`: 사용자에게 보여줄 제목
- `message`: 요약 메시지
- `changelogUrl`: 상세 변경 내역 링크
- `maintenance.enabled`: 점검 모드 여부
- `maintenance.message`: 점검 안내 문구
- `maintenance.retryAfterSeconds`: 재시도 권장 시간

#### 판단 규칙

- 현재 클라이언트 버전이 `minSupportedVersion`보다 낮으면 하드 업데이트로 처리
- 현재 클라이언트 버전이 최신보다 낮지만 지원 범위 안이면 소프트 업데이트로 처리
- `forceUpdate = true`이면 지원 범위와 무관하게 강제 업데이트 처리 가능

#### 캐시 정책

- 반드시 `no-store`
- CDN을 쓰더라도 즉시 갱신되도록 설정

---

### 4.2 GET /api/app/releases/:version

특정 버전의 릴리스 노트를 조회하는 API다.

#### 목적

- 버전별 변경사항 확인
- 업데이트 안내 화면에서 상세 정보 표시

#### 요청 예시

```http
GET /api/app/releases/1.8.0
```

#### 응답 예시

```json
{
  "ok": true,
  "data": {
    "version": "1.8.0",
    "releasedAt": "2026-05-16T09:00:00.000Z",
    "title": "버그 수정 및 성능 개선",
    "items": [
      "푸시 구독 만료 처리 개선",
      "서비스워커 업데이트 안정화",
      "알림 클릭 시 재진입 개선"
    ]
  }
}
```

---

### 4.3 POST /api/app/update-check

앱 시작 시 한 번에 판단하고 싶을 때 쓰는 통합 판단 API다.

#### 목적

- 현재 클라이언트 버전과 서버 최신 버전 비교
- 소프트/하드 업데이트 여부 반환
- 점검 중 여부 반환

#### 요청 예시

```json
{
  "clientVersion": "1.7.2",
  "buildId": "2026.05.01-01",
  "platform": "web"
}
```

#### 응답 예시

```json
{
  "ok": true,
  "data": {
    "clientVersion": "1.7.2",
    "latestVersion": "1.8.0",
    "minSupportedVersion": "1.6.0",
    "updateState": "soft_update",
    "shouldReload": false,
    "shouldBlockEntry": false,
    "message": "새 버전이 있습니다. 나중에 업데이트해도 됩니다.",
    "release": {
      "version": "1.8.0",
      "title": "버그 수정 및 성능 개선"
    }
  }
}
```

#### `updateState` 값

- `up_to_date`
- `soft_update`
- `hard_update`
- `maintenance`

#### 상태별 동작

- `up_to_date`: 바로 메인 화면 진입
- `soft_update`: 배너 또는 모달 표시
- `hard_update`: 진입 차단 후 업데이트 화면으로 이동
- `maintenance`: 점검 안내 화면으로 이동

---

## 5. 푸시 알림 API

현재 프로젝트에 이미 있는 엔드포인트를 기준으로 정리한다.

### 5.1 GET /api/push/vapid-key

#### 목적

- 클라이언트가 푸시 구독을 생성할 때 사용할 VAPID 공개키 제공

#### 인증

- 세션 기반 인증 적용 가능
- 현재 구현은 `withApiSession`으로 감싸져 있음

#### 응답 예시

```json
{
  "ok": true,
  "vapidPublicKey": "BOr..."
}
```

---

### 5.2 POST /api/push/subscribe

#### 목적

- 브라우저 푸시 구독 정보를 DB에 저장
- 앱이 꺼져 있어도 다음 변경 시 푸시를 받을 수 있게 준비

#### 인증

- 로그인 필요

#### 요청 예시

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "p256dh": "...",
  "auth": "...",
  "browserId": "chrome-desktop-001"
}
```

또는 다음 형식도 허용 가능하다.

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "browserId": "chrome-desktop-001"
}
```

#### 응답 예시

```json
{
  "ok": true,
  "subscription": {
    "id": 101,
    "endpoint": "https://fcm.googleapis.com/fcm/send/..."
  }
}
```

#### 주요 검증

- 로그인 여부
- endpoint, p256dh, auth 존재 여부
- 기존 구독 존재 시 update
- 없으면 create

---

### 5.3 POST /api/push/verify

#### 목적

- 저장된 푸시 구독이 아직 유효한지 확인
- 만료되었거나 삭제된 구독 정리 전 검증

#### 인증

- 로그인 필요

#### 요청 예시

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

#### 응답 예시

```json
{
  "ok": true,
  "isValid": true,
  "subscriptionId": 101
}
```

또는 유효하지 않으면

```json
{
  "ok": true,
  "isValid": false,
  "message": "구독 정보를 찾을 수 없습니다"
}
```

#### 용도

- 앱 재실행 시 푸시 구독이 살아 있는지 확인
- 알림 재전송 전 유효성 체크
- DB 청소 작업 전 검증

---

### 5.4 POST /api/push/unsubscribe

#### 목적

- 사용자가 푸시 수신을 끌 때 구독 삭제

#### 인증

- 로그인 필요

#### 요청 예시

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

#### 응답 예시

```json
{
  "ok": true
}
```

---

### 5.5 POST /api/push/validate

#### 목적

- DB에 저장된 푸시 구독을 실제 전송 시도 기반으로 검증
- 알림 발송 실패 전 사전 점검

#### 인증

- 로그인 필요

#### 요청 예시

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

#### 응답 예시

```json
{
  "ok": true,
  "valid": true,
  "message": "구독이 유효합니다"
}
```

---

### 5.6 POST /api/push/send

#### 목적

- 특정 사용자 또는 특정 구독들에 푸시 알림 전송
- 앱이 꺼진 사용자에게 업데이트 재진입 알림 발송

#### 인증

- 로그인 필요
- 내부 운영 API로 제한하는 것을 권장

#### 요청 예시

```json
{
  "recipientId": 12,
  "title": "새 버전이 배포되었습니다",
  "body": "앱을 다시 열면 최신 버전으로 동기화됩니다.",
  "data": {
    "type": "release_notice",
    "url": "/releases/1.8.0"
  }
}
```

#### 응답 예시

```json
{
  "ok": true,
  "sent": 3,
  "failed": 1,
  "total": 4,
  "message": "3개의 알림이 성공적으로 전송되었습니다, 1개 실패"
}
```

#### 권장 제한

- 관리자 또는 서버 내부 작업만 허용
- 일반 클라이언트가 직접 호출하지 못하게 보호
- 대량 발송은 큐 기반 처리 권장

---

## 6. 릴리스 알림 전송 API

상용 서비스에서는 배포 완료 시점에 아래와 같은 내부 API 또는 작업 큐를 두는 것이 좋다.

### 6.1 POST /api/internal/releases/notify

#### 목적

- 새 버전 배포 시 대상 사용자에게 푸시 발송
- 영향 범위가 큰 경우 앱 재진입 유도

#### 요청 예시

```json
{
  "version": "1.8.0",
  "audience": "all",
  "priority": "high"
}
```

#### 응답 예시

```json
{
  "ok": true,
  "queued": true,
  "targetCount": 1524
}
```

#### 운영 원칙

- 외부 공개 금지
- 관리자 인증 또는 서버-서버 인증 필요
- 대량 작업은 즉시 전송보다 큐 적재를 권장

---

## 7. 앱 재실행 시 권장 호출 순서

1. 앱 진입
2. `GET /api/app/releases/latest` 또는 `POST /api/app/update-check`
3. 결과에 따라 소프트/하드 업데이트 분기
4. 필요 시 `GET /api/push/vapid-key` 또는 구독 상태 확인
5. 메인 데이터 재조회
6. 소켓 재연결 또는 실시간 데이터 동기화

---

## 8. 추천 에러 코드

### 버전 게이트 API

- `APP_VERSION_REQUIRED`: 강제 업데이트 필요
- `APP_VERSION_TOO_OLD`: 지원 종료 버전
- `APP_MAINTENANCE`: 점검 중

### 푸시 API

- `PUSH_SUBSCRIPTION_NOT_FOUND`
- `PUSH_SUBSCRIPTION_INVALID`
- `PUSH_SUBSCRIPTION_EXPIRED`
- `PUSH_VAPID_KEY_MISSING`
- `PUSH_SEND_FAILED`

---

## 9. 구현 우선순위

1. `GET /api/app/releases/latest`
2. `POST /api/app/update-check`
3. 업데이트 안내 UI
4. 푸시 알림 기반 재진입 유도
5. 내부 릴리스 알림 발송 API

---

## 10. 결론

앱이 실행되지 않은 동안의 업데이트는 클라이언트가 아니라 서버가 통제해야 한다.
따라서 실서비스에서는 버전 게이트 API, 릴리스 메타데이터 API, 푸시 알림 API를 함께 둬서 다음 실행 시점에 정확히 동기화되도록 만드는 것이 가장 안전하다.
