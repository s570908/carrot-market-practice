# Prisma 모델 명세서 (최소 필수)

## 개요

PWA 최소 API를 지원하기 위한 Prisma 데이터베이스 모델 명세.

이미 존재하는 모델과 새로 추가해야 할 모델을 분리해서 정리.

---

## 1. 이미 존재하는 모델

### 1.1 PushSubscription (기존)

```prisma
model PushSubscription {
  id        Int                    @id @default(autoincrement())
  createdAt DateTime               @default(now())
  updatedAt DateTime               @updatedAt
  userId    Int
  endpoint  String                 @db.Text
  p256dh    String                 @db.Text
  auth      String                 @db.Text
  browserId String?
  user      User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    PushSubscriptionStatus @default(ACTIVE)

  @@index([userId])
  @@index([endpoint(length: 191)])
}

enum PushSubscriptionStatus {
  ACTIVE
  EXPIRED
  INVALID
}
```

**용도**: 사용자의 브라우저 푸시 구독 정보 저장

**주요 칼럼**:
- `endpoint`: FCM 또는 푸시 서비스 엔드포인트
- `p256dh`, `auth`: 푸시 메시지 암호화 키
- `status`: 구독 상태 (활성/만료/무효)

**트러블슈팅**: 이미 있으면 그대로 사용

---

## 2. 새로 추가할 모델

### 2.1 AppRelease (NEW)

**목적**: 앱 배포 버전 정보 관리

```prisma
model AppRelease {
  id          Int      @id @default(autoincrement())
  version     String   @unique
  buildId     String   @unique
  releasedAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  forceUpdate Boolean  @default(false)
  message     String?
  
  @@index([releasedAt])
  @@index([version])
}
```

**칼럼 설명**:

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Int | PK |
| version | String | 버전 (예: "1.0.0") |
| buildId | String | 빌드 식별자 (예: "2026.05.16-01") |
| releasedAt | DateTime | 배포 시각 |
| forceUpdate | Boolean | 즉시 업데이트 강제 여부 |
| message | String | 사용자 안내 메시지 |

**사용 예시**:

```typescript
// 최신 버전 조회
const latest = await prisma.appRelease.findFirst({
  orderBy: { releasedAt: 'desc' }
});

// 특정 버전 조회
const release = await prisma.appRelease.findUnique({
  where: { version: '1.0.0' }
});
```

**마이그레이션 명령**:

```bash
npx prisma migrate dev --name add_app_release
```

---

## 3. 모델 추가 절차

### 단계 1: schema.prisma 수정

`prisma/schema.prisma` 파일에 다음을 추가:

```prisma
model AppRelease {
  id          Int      @id @default(autoincrement())
  version     String   @unique
  buildId     String   @unique
  releasedAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  forceUpdate Boolean  @default(false)
  message     String?
  
  @@index([releasedAt])
  @@index([version])
}
```

### 단계 2: 마이그레이션 생성

```bash
npx prisma migrate dev --name add_app_release
```

### 단계 3: Prisma 클라이언트 재생성

자동으로 생성되지만, 필요시:

```bash
npx prisma generate
```

---

## 4. 초기 데이터 설정

### seed.js 또는 수동 입력

현재 배포된 버전을 DB에 등록:

```typescript
const appRelease = await prisma.appRelease.create({
  data: {
    version: "1.0.0",
    buildId: "2026.05.16-01",
    releasedAt: new Date(),
    forceUpdate: false,
    message: "앱을 시작하면 최신 버전으로 자동 업데이트됩니다"
  }
});
```

---

## 5. API 별 필요 쿼리

### /api/app/version

```typescript
const release = await prisma.appRelease.findFirst({
  orderBy: { releasedAt: 'desc' }
});

return {
  ok: true,
  version: release.version,
  forceUpdate: release.forceUpdate
};
```

### /api/push/subscribe

```typescript
const sub = await prisma.pushSubscription.create({
  data: {
    userId: user.id,
    endpoint,
    p256dh,
    auth,
    browserId
  }
});
```

### /api/push/send

```typescript
const subs = await prisma.pushSubscription.findMany({
  where: {
    userId: targetUserId,
    status: 'ACTIVE'
  }
});
```

---

## 6. 확장 시 추가 모델 (필요 시)

### AppReleaseNote (향후)

릴리스 노트가 필요하면:

```prisma
model AppReleaseNote {
  id          Int      @id @default(autoincrement())
  releaseId   Int
  title       String
  items       String   @db.Text // JSON 배열
  createdAt   DateTime @default(now())
  
  release     AppRelease @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  
  @@index([releaseId])
}
```

---

## 7. 현재 상태 체크리스트

- [ ] `PushSubscription` 모델 확인
- [ ] `AppRelease` 모델 추가
- [ ] 마이그레이션 실행
- [ ] 초기 데이터 입력
- [ ] API 라우트 구현
- [ ] 테스트
