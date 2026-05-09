# 🛠 서비스 워커 등록 및 작동 과정 (강화된 실제 구현 기준)

> 이 문서는 `service-worker-flow.md`의 기본 흐름을 토대로,  
> 실제 프로젝트 코드에서 추가/강화된 항목을 반영한 보완 문서입니다.

---

## 1. 브라우저가 서비스 워커를 지원하는지 확인

기본 문서와 동일하지만, 실제 구현에서는 `window.addEventListener('load', ...)` 방식이 아닌  
**React 컴포넌트(`PushNotificationService.tsx`)의 `useEffect` 안에서** 등록합니다.

```typescript
// components/PushNotificationService.tsx
useEffect(() => {
  if (!('serviceWorker' in navigator)) return;

  const registerServiceWorker = async () => {
    const registration = await navigator.serviceWorker.register(
      '/service-worker.js',
      { scope: "/" }  // ← 전체 경로를 scope로 명시
    );
    console.log('Service Worker 등록 성공:', registration.scope);
  };

  registerServiceWorker();
}, []);
```

**추가된 점:**
- `{ scope: "/" }` 옵션으로 전체 앱 경로를 서비스 워커 제어 범위로 명시합니다.
- 로그인 페이지(`/enter`)를 제외한 경우에만 실행합니다.
- React 생명주기(마운트 1회)에 맞게 관리합니다.

---

## 2. 서비스 워커 등록 요청

기본 문서와 동일합니다.  
브라우저가 `/service-worker.js`를 요청하고 파일 변경 여부를 확인합니다.

---

## 3. 설치(install) 단계

기본 문서와 코드가 **완전히 동일**합니다.

```javascript
const CACHE_NAME = "soy-market-v1";

const CACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/soy-bean-192-192.png",
  "/icons/soy-bean-512-512.png",
  "/offline.html",
  "/dev-server-offline.html",  // ← 추가: 개발 서버 중지 시 폴백 페이지
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});
```

---

## 4. 활성화(activate) 단계

기본 문서와 코드가 **완전히 동일**합니다.

```javascript
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});
```

---

## 5. fetch 이벤트 (강화된 캐싱 전략)

기본 문서의 캐싱 전략에 더해, 실제 구현에서는 **3가지 보호 로직**이 추가되어 있습니다.

### 5-1. 외부 도메인 우회 (추가됨)

타사 서비스(Google Fonts, TMap 등)의 요청은 서비스 워커가 처리하지 않고 브라우저에 위임합니다.

```javascript
const bypassDomains = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'apis.openapi.sk.com',
  'tmap.co.kr'
];

if (bypassDomains.some(domain => url.hostname.includes(domain))) {
  return;  // 브라우저 기본 동작으로 처리
}
```

**이유:** 서비스 워커가 외부 도메인 요청을 가로채면 CORS 오류 또는 타임아웃(408)이 발생할 수 있습니다.

### 5-2. 캐시 불가 요청 필터 (추가됨)

다음 조건에 해당하는 요청은 캐시에서 완전히 제외합니다.

```javascript
const isCacheableRequest = (request) => {
  const url = new URL(request.url);

  // chrome-extension:, data:, blob: 등 http가 아닌 스킴은 캐시 불가
  if (!url.protocol.startsWith('http')) {
    return false;
  }

  // API 요청은 항상 최신 데이터 필요 → 캐시 제외
  if (url.pathname.startsWith('/api/')) {
    return false;
  }

  return true;
};
```

### 5-3. 네비게이션 실패 시 개발/운영 환경 분기 (추가됨)

기본 문서는 단순히 `offline.html`을 반환하지만,  
실제 구현에서는 **localhost 여부**를 판단해 다른 폴백 페이지를 반환합니다.

```javascript
if (event.request.mode === 'navigate') {
  event.respondWith(
    fetch(event.request).catch((error) => {
      const url = new URL(event.request.url);
      const isDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

      if (isDev) {
        // 개발 서버 중지 가능성 → 개발자용 안내 페이지
        return caches.match('/dev-server-offline.html')
          .then(response => response || caches.match('/offline.html'));
      } else {
        // 일반 네트워크 오류 → 사용자용 오프라인 페이지
        return caches.match('/offline.html');
      }
    })
  );
  return;
}
```

### 전체 fetch 전략 요약

| 리소스 | 전략 | 추가 처리 |
|-------|------|---------|
| 외부 도메인 | 서비스 워커 제외 | bypass 목록 기반 |
| `/api/*` | 서비스 워커 제외 | isCacheableRequest() |
| `manifest.json` | 네트워크 우선 | 실패 시 캐시 |
| 이미지/CSS/JS/폰트 | 캐시 우선 | 백그라운드 갱신, 이미지 실패 시 기본 아이콘 |
| HTML 네비게이션 | 네트워크 우선 | 개발/운영 분기 오프라인 폴백 |
| 기타 | 네트워크 우선 | 성공 시 캐시 저장, 실패 시 캐시 |

---

## 6. 푸시 알림 처리 (강화됨)

기본 문서와 동일하지만, **`requireInteraction` 옵션이 추가**되었습니다.

```javascript
self.addEventListener("push", (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }

    const options = {
      body: data.body || "",
      icon: data.icon || "/icons/soy-bean-192-192.png",
      badge: data.badge || "/icons/soy-bean-192-192.png",
      data: data.data || {},
      vibrate: [100, 50, 100],
      actions: [
        { action: "view", title: "자세히 보기" },
        { action: "close", title: "닫기" },
      ],
      requireInteraction: data.requireInteraction === true,  // ← 추가됨
    };

    event.waitUntil(self.registration.showNotification(data.title || "새로운 알림", options));
  }
});
```

**`requireInteraction`이란:**
- `true`이면 사용자가 직접 클릭하거나 닫을 때까지 알림이 화면에 유지됩니다.
- 약속 알림, 중요 공지 등 반드시 확인이 필요한 알림에 사용합니다.
- 서버에서 발송할 때 `requireInteraction: true`를 payload에 담아 제어합니다.

---

## 7. 알림 클릭 처리 (크게 강화됨)

기본 문서는 단순히 새 탭을 여는 방식이지만,  
실제 구현에서는 **이미 열린 탭을 재사용**하는 고도화된 로직이 적용되어 있습니다.

### 기본 문서의 방식 (단순)
```javascript
// 기존: 항상 새 탭 열기
clients.openWindow(data.url);
```

### 실제 구현 (고도화)
```javascript
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view" && event.notification.data) {
    const urlToOpen = event.notification.data.url || "/";

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {

          // 1단계: 동일한 pathname을 가진 탭 찾기
          const matchingClients = clientList.filter(client => {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen, self.location.origin);
            return clientUrl.pathname === targetUrl.pathname;
          });

          // 2단계: 있으면 포커스, 없으면 새 탭
          if (matchingClients.length > 0) {
            return matchingClients[0].focus();  // ← 탭 재사용
          }
          return clients.openWindow(urlToOpen);  // ← 새 탭 열기
        })
    );

  } else if (event.action === "close") {
    // "닫기" 버튼 클릭 → 알림만 닫음 (event.notification.close() 이미 실행)
    console.log("[Service Worker] 알림 닫기 버튼 클릭");

  } else {
    // 알림 영역 직접 클릭 (액션 버튼이 아닌 빈 영역)
    const urlToOpen = (event.notification.data || {}).url || "/";

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          const matchingClients = clientList.filter(client => {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen, self.location.origin);
            return clientUrl.pathname === targetUrl.pathname;
          });

          if (matchingClients.length > 0) return matchingClients[0].focus();
          return clients.openWindow(urlToOpen);
        })
    );
  }
});
```

**강화된 이유:**
| 상황 | 기본 문서 동작 | 실제 구현 동작 |
|-----|------------|------------|
| 동일 페이지 탭이 이미 열려 있음 | 새 탭 추가로 열림 | 기존 탭으로 포커스 이동 |
| "닫기" 버튼 클릭 | 처리 없음 | 명시적으로 로깅 처리 |
| 알림 빈 영역 클릭 | 처리 없음 | "자세히 보기"와 동일하게 처리 |

---

## 8. 클라이언트와의 메시지 통신

기본 문서와 코드가 **완전히 동일**합니다.

```javascript
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TEST_MESSAGE") {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SERVICE_WORKER_RESPONSE",
          data: "서비스 워커가 정상 동작 중입니다.",
        });
      });
    });
  }
});
```

---

## 9. 구독 자동 모니터링 (문서에 없는 항목)

`pushUtils.ts`에 구현된 **구독 상태 자동 복구 시스템**입니다.  
서비스 워커 파일 외부(클라이언트 코드)에서 동작하며, 기본 문서에는 없는 내용입니다.

```typescript
// libs/client/pushUtils.ts

export function startPushSubscriptionMonitoring() {
  // 1. 앱 시작 시 1회
  checkAndRefreshPushSubscriptionEnhanced();

  // 2. 브라우저 탭 포커스 복귀 시
  window.addEventListener('focus', () => {
    checkAndRefreshPushSubscriptionEnhanced();
  });

  // 3. 5분마다 주기적 확인
  setInterval(() => {
    checkAndRefreshPushSubscriptionEnhanced();
  }, 5 * 60 * 1000);
}
```

**자동 복구 시나리오:**
- 구독 엔드포인트가 만료된 경우 → 자동 재구독
- FCM 엔드포인트 형식이 변경된 경우(`/fcm/send/` → `/wp/`) → 갱신 안내
- 브라우저 재설치 등으로 구독 정보가 사라진 경우 → 재등록

---

## 📝 전체 요약 (강화된 버전)

```
앱 시작
  ↓
PushNotificationService.tsx → serviceWorker.register('/service-worker.js', { scope: "/" })
  ↓
[install]  캐시 생성 (offline.html, dev-server-offline.html 포함) → skipWaiting()
  ↓
[activate] 구 버전 캐시 삭제 → clients.claim()
  ↓
[fetch]    요청 유형별 캐싱 전략 적용
           + 외부 도메인 bypass
           + /api/ 경로 제외
           + 개발/운영 오프라인 페이지 분기
  ↓
[push]     서버 → FCM → 서비스 워커 → showNotification()
           requireInteraction으로 중요 알림 유지
  ↓
[notificationclick]
           동일 탭 있으면 포커스 / 없으면 새 탭
           "닫기", 빈 영역 클릭도 별도 처리
  ↓
[message]  페이지로부터 TEST_MESSAGE 수신 → 상태 응답
  ↓
[백그라운드] 5분마다 + 포커스 복귀 시 구독 유효성 자동 확인 및 복구
```
