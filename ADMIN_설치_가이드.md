# Admin 버전 관리 시스템 설치 가이드

## 1단계: Prisma 마이그레이션

### 1.1 마이그레이션 생성

```bash
npx prisma migrate dev --name add_app_release
```

**역할**:
- `AppRelease` 테이블 생성
- `Prisma Client` 자동 재생성

**예상 출력**:
```
✔ Created new migration file ./prisma/migrations/[timestamp]_add_app_release/migration.sql

Your database is now in sync with your schema. Done in XXXms
✔ Generated Prisma Client (X.X.X) to ./node_modules/.prisma/client in XXXms
```

### 1.2 오류 발생 시

만약 마이그레이션 충돌이 발생하면:

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 문제 해결 후 재시도
npx prisma migrate dev --name add_app_release
```

---

## 2단계: 초기 데이터 입력

### 2.1 방법 A: Admin 페이지에서 입력 (권장)

1. `/admin/releases` 페이지 접속
2. 폼에서 현재 앱 버전 입력:
   - 버전: `1.0.0`
   - 빌드 ID: `2026.05.16-00`
   - 강제 업데이트: 체크 해제
3. "추가" 버튼 클릭

### 2.2 방법 B: 직접 DB 입력 (선택사항)

```sql
INSERT INTO "AppRelease" (version, buildId, forceUpdate, message, releasedAt, createdAt, updatedAt)
VALUES ('1.0.0', '2026.05.16-00', false, '초기 버전', NOW(), NOW(), NOW());
```

---

## 3단계: 파일 구조 확인

생성된 파일:

```
pages/api/admin/app-releases.ts          # API 라우트
pages/admin/releases.tsx                 # Admin 페이지
apiLibs/appReleases.ts                   # API 클라이언트
prisma/schema.prisma                     # 데이터 모델 (수정됨)
ADMIN_버전관리_가이드.md                  # 사용 가이드
```

---

## 4단계: 개발 서버 재시작

```bash
npm run dev
```

그리고 `/admin/releases` 페이지 접속

---

## 5단계: API 엔드포인트 확인

```bash
# 모든 버전 조회
curl http://localhost:3000/api/admin/app-releases

# 응답 예시
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "version": "1.0.0",
      "buildId": "2026.05.16-00",
      "forceUpdate": false,
      "message": "초기 버전",
      "releasedAt": "2026-05-16T09:00:00.000Z",
      "createdAt": "2026-05-16T09:00:00.000Z",
      "updatedAt": "2026-05-16T09:00:00.000Z"
    }
  ]
}
```

---

## 6단계: 클라이언트 코드에 연결

### 최소 API 구현

`pages/api/app/version.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const latest = await client.appRelease.findFirst({
      orderBy: { releasedAt: 'desc' }
    });

    if (!latest) {
      return res.status(404).json({ ok: false, error: "버전 정보 없음" });
    }

    return res.status(200).json({
      ok: true,
      version: latest.version,
      forceUpdate: latest.forceUpdate
    });
  } catch (error) {
    console.error("버전 조회 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류" });
  }
}

export default withHandler({
  methods: ["GET"],
  handler
});
```

---

## 7단계: 테스트

### React 컴포넌트에서 테스트

```typescript
import { useEffect, useState } from "react";

export default function VersionTest() {
  const [version, setVersion] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/app/version")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setVersion(data.version);
          setForceUpdate(data.forceUpdate);
        }
      });
  }, []);

  return (
    <div>
      <p>현재 버전: {version}</p>
      <p>강제 업데이트: {forceUpdate ? "필수" : "선택"}</p>
    </div>
  );
}
```

---

## 문제 해결

### "AppRelease 테이블을 찾을 수 없음" 오류

```bash
# 마이그레이션 다시 실행
npx prisma migrate dev
```

### Admin 페이지 접근 불가

```bash
# 로그인 확인 및 세션 상태 확인
# /login에서 로그인 후 시도
```

### "버전이 이미 존재합니다" 오류

- 같은 버전으로 재추가 시 발생
- Admin 페이지에서 "수정" 버튼으로 기존 버전 수정

---

## 체크리스트

- [ ] `npx prisma migrate dev --name add_app_release` 실행
- [ ] Admin 페이지에서 초기 버전 입력
- [ ] 개발 서버 재시작
- [ ] `/admin/releases` 페이지 접속 수정 확인
- [ ] `/api/app/version` API 테스트
- [ ] `/api/admin/app-releases` API 테스트 (GET, POST, PATCH, DELETE)

---

## 다음 단계

1. `GET /api/app/version` API 구현 (제공된 코드 참고)
2. 앱 시작 시 버전 확인 로직 추가
3. 강제 업데이트 시 진입 차단 화면 구현
4. 푸시 알림 연동 (`POST /api/push/send`)
