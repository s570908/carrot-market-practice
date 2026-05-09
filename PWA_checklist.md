# PWA 환경 설정 및 검증 체크리스트

이 문서는 당근마켓 프랙티스 프로젝트의 PWA를 정상 작동시키기 위한 완벽한 체크리스트입니다.

---

## 📋 Phase 1: 환경 변수 설정

### ☐ 1.1 VAPID 키 생성
푸시 알림 기능에 필수적인 VAPID 키를 생성합니다.

터미널에서 아래 중 하나 선택:

**옵션 A: npm을 이용한 생성 (권장)**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

**옵션 B: 온라인 생성**
https://www.npmjs.com/package/web-push#command-line

생성 결과:
```
公开钥: AAAA...XXXX
私有钥: AAAA...XXXX
```

### ☐ 1.2 .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용 추가:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```

**중요:**
- `NEXT_PUBLIC_` 접두사는 클라이언트에 노출됨 (공개키라 안전)
- `VAPID_PRIVATE_KEY`는 절대 노출하지 말 것
- `.gitignore`에 `.env.local` 추가되어 있는지 확인

### ☐ 1.3 환경 변수 로드 확인
```bash
npm run dev
```

콘솔에 에러가 없는지 확인

---

## 📋 Phase 2: 정적 파일 검증

### ☐ 2.1 manifest.json 확인
파일: `public/manifest.json`

확인 항목:
- [ ] 파일이 존재하는가?
- [ ] 파일 라인 수가 1 이상인가? (비어있지 않음)
- [ ] 유효한 JSON 형식인가?

최소 필수 구조:
```json
{
  "name": "당근마켓 프랙티스",
  "short_name": "당근마켓",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FF7E36",
  "background_color": "#FFFFFF"
}
```

### ☐ 2.2 service-worker.js 확인
파일: `public/service-worker.js`

확인 항목:
- [ ] 파일이 public/ 폴더에 있는가?
- [ ] 파일 크기가 0KB가 아닌가?
- [ ] `self.addEventListener("install", ...)` 있는가?
- [ ] `self.addEventListener("activate", ...)` 있는가?
- [ ] `self.addEventListener("fetch", ...)` 있는가?

### ☐ 2.3 오프라인 페이지 확인
파일: `public/offline.html`, `public/dev-server-offline.html`

확인 항목:
- [ ] 두 파일이 모두 존재하는가?
- [ ] 파일이 비어있지 않은가? (최소한 HTML 마크업 있음)

### ☐ 2.4 아이콘 파일 확인
폴더: `public/icons/`

필수 아이콘:
- [ ] `soy-bean-192-192.png` 존재
- [ ] `soy-bean-512-512.png` 존재

선택 아이콘:
- [ ] `soy-bean-72-72.png`
- [ ] `soy-bean-96-96.png`
- [ ] `soy-bean-128-128.png`
- [ ] `soy-bean-144-144.png`
- [ ] `soy-bean-152-152.png`
- [ ] `soy-bean-384-384.png`

---

## 📋 Phase 3: 개발 환경 시작

### ☐ 3.1 개발 서버 시작
```bash
npm run dev
```

기대 출력:
```
> Server ready on http://localhost:3000
```

### ☐ 3.2 콘솔 에러 확인
서버 콘솔에서:
- [ ] `[Middleware]` 로그는 보이는가? (정상)
- [ ] `Error` 레벨 로그가 없는가?
- [ ] `Cannot find module` 에러 없는가?

### ☐ 3.3 브라우저에서 localhost:3000 접속
- [ ] 페이지가 로드되는가?
- [ ] 콘솔에 에러가 없는가?

---

## 📋 Phase 4: DevTools 검증

### ☐ 4.1 Manifest 확인
1. DevTools 열기 (F12)
2. Application 탭
3. Manifest 섹션

확인 항목:
- [ ] manifest.json 내용이 표시되는가?
- [ ] "Name": "당근마켓 프랙티스" 보이는가?
- [ ] 아이콘이 로드되고 표시되는가?
- [ ] Start URL이 "/"로 설정되어 있는가?

### ☐ 4.2 Service Workers 확인
1. DevTools → Application 탭
2. Service Workers 섹션

확인 항목:
- [ ] `/service-worker.js` 항목이 보이는가?
- [ ] Status: `Active and running` 표시되는가?
- [ ] 상태 표시등이 초록색인가?

**문제 발생 시:**
- [ ] "Unregister" 클릭 후 페이지 새로고침
- [ ] DevTools → Console에서 `navigator.serviceWorker.getRegistrations()` 실행

### ☐ 4.3 Cache Storage 확인
1. DevTools → Application 탭
2. Cache Storage 섹션 확장

확인 항목:
- [ ] `soy-market-v1` 캐시가 생성되었는가?
- [ ] 캐시를 클릭해 내용 보기
  - [ ] `/` 엔트리 있는가?
  - [ ] `/offline.html` 있는가?
  - [ ] `/manifest.json` 있는가?
  - [ ] `/icons/soy-bean-192-192.png` 있는가?

---

## 📋 Phase 5: 기능 별 동작 테스트

### ☐ 5.1 캐싱 확인 (Cache First / Stale While Revalidate)
1. DevTools → Network 탭 열기
2. 페이지 새로고침 (Cmd+R 또는 F5)
3. CSS, JS, 이미지 요청 클릭

확인 항목:
- [ ] `Size` 열에 `(memory cache)` 또는 `(service worker)` 표시되는가?
- [ ] 따로 네트워크 요청이 없는가? (또는 백그라운드에서만)

### ☐ 5.2 오프라인 폴백 테스트
1. DevTools → Network 탭
2. 체크박스: `Offline` 체크
3. 페이지 새로고침 (F5)

확인 항목:
- [ ] 페이지가 완전히 블랭크가 아닌가?
- [ ] `offline.html` 내용이 표시되는가?
- [ ] 에러 메시지나 안내가 보이는가?

**정상 후 Offline 체크 해제**

### ☐ 5.3 개발 환경 오프라인 테스트
1. 개발 서버 중지 (Ctrl+C)
2. DevTools → Network 탭에서 Offline 체크
3. 페이지 새로고침 (F5)

확인 항목:
- [ ] `dev-server-offline.html` 내용이 표시되는가? (dev 특화 메시지)
- [ ] 또는 기본 `offline.html` 메시지가 표시되는가?

**정상 후:**
1. Offline 체크 해제
2. 개발 서버 다시 시작: `npm run dev`

### ☐ 5.4 Service Worker 메시지 테스트
1. DevTools → Console 탭
2. 아래 명령 실행:

```javascript
navigator.serviceWorker.controller.postMessage({
  type: "TEST_MESSAGE",
  data: "Hello from Console"
});
```

확인 항목:
- [ ] 응답이 오는가? (콘솔에 로그 표시)
- [ ] 오류가 없는가?

### ☐ 5.5 PWA Tester 페이지 접속
1. `http://localhost:3000/pwa-tester` 접속
2. 페이지가 로드되는가?

확인 항목:
- [ ] "PWA 상태" 섹션이 보이는가?
- [ ] "서비스 워커 상태": "Active: 1 registered" 표시되는가?
- [ ] "캐시 상태": `soy-market-v1` 보이는가?
- [ ] "설치 가능 여부" 확인

---

## 📋 Phase 6: 푸시 알림 (선택 - VAPID 키 필수)

### ✋ 사전 확인
- [ ] VAPID_PRIVATE_KEY 설정했는가?
- [ ] NEXT_PUBLIC_VAPID_PUBLIC_KEY 설정했는가?
- [ ] 개발 서버 재시작했는가? (`npm run dev`)

### ☐ 6.1 푸시 알림 토글 ON
1. `/pwa-tester` 페이지
2. "푸시 알림 설정" 섹션
3. 토글을 ON

확인 항목:
- [ ] 브라우저 알림 권한 팝업 나타나는가?
- [ ] "허용" 클릭
- [ ] 토글이 ON 상태로 유지되는가?
- [ ] "구독 유효성 관리" 버튼이 나타나는가?

### ☐ 6.2 푸시 알림 테스트
1. `/pwa-tester` 페이지의 "테스트 기능" 섹션
2. "푸시 알림 테스트" 버튼 클릭

확인 항목:
- [ ] 로딩 상태가 표시되는가?
- [ ] 브라우저 우측 하단에 알림이 나타나는가?
- [ ] 알림 제목: "푸시 알림 테스트"
- [ ] 알림 본문: "원격 푸시 알림 테스트입니다..."
- [ ] 알림에 아이콘이 보이는가?

### ☐ 6.3 알림 클릭 동작
1. 나타난 알림 클릭
2. 또는 "자세히 보기" 버튼 클릭

확인 항목:
- [ ] `/pwa-tester` 페이지로 이동하는가?
- [ ] 탭이 포커스되는가?

### ☐ 6.4 엔드포인트 상태 확인
1. `/pwa-tester` → "푸시 알림 설정"
2. "엔드포인트 정보 보기" 클릭

확인 항목:
- [ ] 엔드포인트 URL이 표시되는가?
- [ ] 파란색 점 (정상 상태) 표시되는가?
- [ ] "정상적인 구독 상태" 메시지 보이는가?

---

## 📋 Phase 7: 설치 프롬프트 테스트

### ☐ 7.1 설치 프롬프트 표시 확인
1. Chrome 주소창 우측 확인

확인 항목:
- [ ] "설치" 또는 앱 아이콘 버튼 보이는가?
- [ ] 클릭하면 설치 팝업 나타나는가?

**참고:** 설치 조건
- HTTPS (localhost는 예외)
- manifest.json Valid
- Service Worker "Active and running"
- 방문 2회 이상 또는 일정 시간 경과 시

### ☐ 7.2 /pwa-tester 페이지의 설치 버튼
1. `/pwa-tester` 페이지
2. "테스트 기능" 섹션
3. "앱 설치하기" 버튼 있는가?

확인 항목:
- [ ] "앱 설치하기" 버튼이 보이는가?
- [ ] 클릭하면 설치 대화상자 나타나는가?

---

## ⚠️ 트러블슈팅

### 문제: Service Worker 등록 실패
```
SecurityError: Only secure origins are allowed
```

**해결책:**
- [ ] localhost 사용하는가? (HTTP 허용)
- [ ] HTTPS 배포인가? (필수)
- [ ] 포트가 올바른가? (기본 3000)

---

### 문제: manifest.json 로드 안 됨
```
Manifest: Image url is not valid
```

**확인 사항:**
- [ ] `public/manifest.json` 파일 존재?
- [ ] 아이콘 경로 올바른가?
- [ ] 아이콘 파일이 실제로 있는가?

**수정:**
[public/manifest.json](public/manifest.json) 아이콘 경로 재확인

---

### 문제: 캐시가 생성 안 됨
```
[Service Worker] install 중...
[Service Worker] 캐시 생성
```

로그는 나오는데 cache에 아무것도 없음

**원인:**
- `CACHE_ASSETS` 리스트의 파일이 실제로 없음
- 예: `/존재하지않는파일.js` 포함 시 전체 install 실패

**수정:**
[public/service-worker.js](public/service-worker.js)의 `CACHE_ASSETS` 배열 확인

---

### 문제: 푸시 알림 안 됨

#### 증상 1: 구독 실패
```
구독 유효성 검사 중 오류가 발생했습니다
```

**확인:**
- [ ] VAPID_PRIVATE_KEY 설정했는가?
- [ ] NEXT_PUBLIC_VAPID_PUBLIC_KEY 설정했는가?
- [ ] `.env.local`에 올바른 형식인가?
- [ ] 개발 서버 재시작했는가? (`npm run dev`)

#### 증상 2: 권한 거부
```
알림 권한이 거부되었습니다
```

**수정:**
1. DevTools → Application → Site settings
2. Notifications 권한을 "Allow" 또는 "Reset"
3. 페이지 새로고침

#### 증상 3: 알림 송신 후 아무것도 안 보임
```
푸시 알림이 발송되었습니다! 잠시 후 알림이 표시됩니다.
```

하지만 실제 알림 안 나옴

**확인:**
- [ ] 브라우저 알림 시스템 설정 확인
- [ ] Windows: 설정 → 시스템 → 알림
- [ ] Mac: 시스템 설정 → 알림
- [ ] 브라우저 탭을 배경으로 보낸 경우 알림 표시됨

---

### 문제: 오프라인 테스트 시 에러 페이지 출력
```
Network error occurred
```

또는

```
Type Error: fetch failed
```

**원인:**
- `offline.html` 파일이 없음
- 캐시가 생성 안 됨

**확인:**
- [ ] `public/offline.html` 파일 존재?
- [ ] DevTools → Cache Storage에 offline.html 캐시됨?

---

## ✅ 최종 정상 상태 확인 리스트

모든 항목이 체크되면 PWA 정상 작동 완료입니다:

- [ ] Development 서버 정상 실행 중
- [ ] manifest.json DevTools에서 로드됨
- [ ] Service Worker "Active and running" 상태
- [ ] "soy-market-v1" 캐시 생성됨
- [ ] Cache Storage에 최소 5개 항목 캐시됨
- [ ] Network Offline 모드에서도 페이지 로드됨
- [ ] `/pwa-tester` 페이지 접속 가능
- [ ] 푸시 알림 권한 설정 완료
- [ ] 푸시 알림 테스트 성공 (또는 스킵)
- [ ] 설치 버튼 표시됨 (또는 조건 미충족 상태 명확함)

---

## 📞 추가 도움

특정 항목에서 막혔거나 추가 설정이 필요하면:

1. 에러 메시지를 정확히 메모
2. DevTools 콘솔 스크린샷
3. `.env.local` 존재 여부 확인 (파일은 공유 X)
4. 서버 시작 로그 복사

위 정보를 준비하면 더 정확한 도움을 드릴 수 있습니다.
