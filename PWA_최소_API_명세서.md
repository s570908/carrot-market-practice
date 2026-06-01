# PWA 최소 API 명세서

## 개요

앱이 실행되지 않은 상태에서도 다음 실행 시 최신 상태를 보장하기 위한 최소 필수 API 명세서.

---

## 1. 버전 확인 API

### GET /api/app/version

**목적**: 앱 시작 시 현재 배포 버전 확인

**응답 예시**:
```json
{
  "ok": true,
  "version": "1.0.0",
  "forceUpdate": false
}
```

**응답 필드**:
- `version`: 현재 배포된 버전 (예: "1.0.0")
- `forceUpdate`: 즉시 업데이트 강제 여부 (true면 진입 차단)

**캐시 정책**: `no-store` (항상 최신 조회)

**호출 시점**: 앱 최초 진입

---

## 2. 푸시 구독 API

### POST /api/push/subscribe

**목적**: 사용자의 푸시 구독 정보 저장

**요청**:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "p256dh": "...",
  "auth": "...",
  "browserId": "chrome-001"
}
```

**응답**:
```json
{
  "ok": true,
  "subscriptionId": 123
}
```

**인증**: 로그인 필요

**캐시 정책**: 캐시 금지

---

## 3. 푸시 발송 API

### POST /api/push/send

**목적**: 특정 사용자에게 푸시 알림 발송

**요청**:
```json
{
  "userId": 12,
  "title": "새 버전이 배포되었습니다",
  "body": "앱을 다시 열면 최신 버전을 받게 됩니다"
}
```

**응답**:
```json
{
  "ok": true,
  "sentCount": 2
}
```

**인증**: 로그인 필요 (관리자 기능)

**캐시 정책**: 캐시 금지

---

## 4. 호출 흐름

### 앱 시작 시

1. `GET /api/app/version` 호출
2. `forceUpdate = true`면 업데이트 화면으로 이동
3. 아니면 메인 화면 진입
4. (백그라운드) `POST /api/push/subscribe` 호출하여 구독 등록

### 푸시 발송 시 (서버 배포 이후)

1. 배포 담당자 또는 관리자가 `POST /api/push/send` 호출
2. 대상 사용자의 모든 활성 구독에 알림 발송
3. 사용자가 알림 클릭 → 앱 재진입 → 새 버전 자동 적용

---

## 5. 추가 확장 (필요 시)

아래 항목들은 운영 중 필요에 따라 추가 가능:

- `GET /api/app/releases/:version` - 릴리스 노트 조회
- `POST /api/push/verify` - 구독 유효성 검증
- `POST /api/push/unsubscribe` - 구독 해제
- `GET /api/push/vapid-key` - VAPID 공개키 조회

---

## 6. 설정 데이터

### 환경 변수

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
APP_VERSION=1.0.0
```

### 배포 전 체크리스트

- [ ] `APP_VERSION`을 실제 배포 버전으로 업데이트
- [ ] `forceUpdate` 값 설정 (필요시)
- [ ] push 라우트 보호 (로그인 필요)
