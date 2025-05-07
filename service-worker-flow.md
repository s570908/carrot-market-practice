# 🛠 서비스 워커 등록 및 작동 과정

## 1. 브라우저가 서비스 워커를 지원하는지 확인

웹 페이지의 `main.js`나 `index.js` 파일에서 서비스 워커를 등록합니다.

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker 등록 성공:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker 등록 실패:', error);
      });
  });
}
```

- `navigator.serviceWorker`가 존재하는지 확인하여 브라우저 지원 여부를 검사합니다.
- `window`의 `load` 이벤트가 발생하면 서비스 워커를 등록합니다.

---

## 2. 서비스 워커 등록 요청

- `navigator.serviceWorker.register('/service-worker.js')` 호출 시,
  - 브라우저가 `/service-worker.js` 파일을 서버에서 다운로드합니다.
  - **항상 새 파일을 요청**하고, **파일 변경 여부를 검사**해 업데이트를 판단합니다.

---

## 3. 서비스 워커가 설치(install) 단계로 진입

```javascript
self.addEventListener("install", (event) => {
  console.log("[Service Worker] 설치 중...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] 캐시 생성");
      return cache.addAll(CACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});
```

- `install` 이벤트 발생.
- 필요한 파일들을 캐시에 저장(`cache.addAll`).
- `self.skipWaiting()`을 호출하면 새 서비스 워커가 바로 활성화 대기 없이 다음 단계로 이동합니다.

> 참고: 기본적으로는 기존 서비스 워커가 있다면 새 서비스 워커는 `waiting` 상태에 머뭅니다. `skipWaiting()` 호출 시 바로 활성화할 수 있습니다.

---

## 4. 서비스 워커가 활성화(activate) 단계로 진입

```javascript
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] 활성화 중...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log("[Service Worker] 오래된 캐시 삭제:", cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});
```

- `activate` 이벤트 발생.
- 이전 버전이 만든 오래된 캐시를 삭제합니다.
- `self.clients.claim()`을 호출하여 새 서비스 워커가 **즉시** 현재 페이지를 제어할 수 있게 합니다.

---

## 5. 이제 서비스 워커가 fetch를 가로챔

```javascript
self.addEventListener("fetch", (event) => {
  // manifest.json 요청에 대해서는 항상 네트워크 우선
  if (event.request.url.includes("manifest.json")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // 이미지, 스타일시트, 스크립트 등 정적 자산은 캐시 우선
  if (
    event.request.destination === 'image' || 
    event.request.destination === 'style' || 
    event.request.destination === 'script' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // 캐시에 있으면 캐시에서 반환
        if (cachedResponse) {
          // 백그라운드에서 네트워크 요청으로 캐시 업데이트 (캐시 리프레시)
          fetch(event.request).then((response) => {
            if (response && response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
          }).catch(() => {/* 실패 무시 */});
          return cachedResponse;
        }

        // 캐시에 없으면 네트워크 요청
        return fetch(event.request).then((response) => {
          if (!response || !response.ok) {
            throw new Error('Network request failed');
          }
          // 네트워크 응답을 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          // 이미지인 경우 기본 이미지 제공 (선택적)
          if (event.request.destination === 'image') {
            return caches.match('/icons/soy-bean-192-192.png');
          }
          // 다른 정적 리소스는 에러 응답
          return new Response('Network error occurred', { status: 408 });
        });
      })
    );
    return;
  }

  // 네비게이션 요청 (HTML 페이지)에 대해 네트워크 우선 전략
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // 그 외의 요청은 네트워크 시도 후 캐시 폴백
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공한 응답은 캐시에 저장 (선택적)
        if (response && response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

- 페이지의 모든 **fetch 요청을 가로채서 처리**합니다.
- 리소스 유형별로 다른 캐싱 전략을 적용합니다:
  - **manifest.json**: 네트워크 우선, 실패 시 캐시 사용
  - **정적 자산(이미지, CSS, JS, 폰트)**: 캐시 우선, 백그라운드에서 캐시 업데이트
  - **HTML 페이지**: 네트워크 우선, 실패 시 오프라인 페이지(`offline.html`) 제공
  - **기타 요청**: 네트워크 우선, 성공한 응답은 캐시에 저장, 실패 시 캐시 사용

---

## 6. 푸시 알림 처리

```javascript
self.addEventListener("push", (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      // JSON 파싱 실패 시 text로 처리
      data = { body: event.data.text() };
    }
    const title = data.title || "새로운 알림";
    const options = {
      body: data.body || "",
      icon: data.icon || "/icons/soy-bean-192-192.png",
      badge: data.badge || "/icons/soy-bean-192-192.png",
      data: data.data || {},
      vibrate: [100, 50, 100],
      actions: [
        {
          action: "view",
          title: "자세히 보기",
        },
        {
          action: "close",
          title: "닫기",
        },
      ],
    };

    // 서비스 워커에서는 알림 권한이 있다고 가정
    // 푸시 이벤트는 권한이 있을 때만 발생하기 때문
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
```

- 서버에서 전송된 푸시 메시지를 처리합니다.
- JSON 데이터를 파싱하고, 실패 시 텍스트로 처리합니다.
- 사용자에게 알림을 표시합니다.
- 알림에는 제목, 내용, 아이콘, 액션 버튼 등이 포함됩니다.

## 7. 알림 클릭 처리

```javascript
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view" && event.notification.data) {
    const data = event.notification.data;
    if (data.url) {
      event.waitUntil(clients.openWindow(data.url));
    } else {
      event.waitUntil(clients.openWindow("/"));
    }
  }
});
```

- 사용자가 알림을 클릭했을 때 동작을 처리합니다.
- 알림을 닫습니다.
- "자세히 보기" 액션 클릭 시, 관련 URL로 이동합니다.
- URL이 없는 경우 홈페이지로 이동합니다.

## 8. 클라이언트와의 메시지 통신

```javascript
self.addEventListener("message", (event) => {
  console.log("[Service Worker] 메시지 수신:", event.data);

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

- 웹 페이지로부터 오는 메시지를 처리합니다.
- 특정 타입의 메시지("TEST_MESSAGE")에 대해 응답합니다.
- 모든 클라이언트에게 서비스 워커의 상태를 알립니다.

---

# 📝 전체 요약

- 웹 페이지가 `navigator.serviceWorker.register()`로 등록 요청
- 브라우저가 `service-worker.js`를 다운로드 (파일 변경 여부 확인)
- `install` 이벤트 → 필요한 파일을 캐시에 저장
- `activate` 이벤트 → 오래된 캐시를 삭제하고 새 서비스 워커 활성화
- `fetch` 요청을 서비스 워커가 가로채어 리소스 유형별 최적화된 전략으로 응답:
  - 정적 자산은 캐시 우선 전략으로 빠른 로딩 제공
  - 네비게이션 요청은 최신 콘텐츠를 위해 네트워크 우선 전략 적용
  - 모든 네트워크 실패 시 적절한 폴백 제공
- `push` 이벤트 → 서버에서 오는 푸시 알림 처리
- `notificationclick` 이벤트 → 사용자의 알림 상호작용 처리
- `message` 이벤트 → 웹 페이지와의 통신 처리

이러한 전략적 접근으로 오프라인 환경에서도 앱이 잘 작동하고, 사용자 경험을 극대화합니다.
