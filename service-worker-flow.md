
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
  // manifest.json은 항상 네트워크 우선
  if (event.request.url.includes("manifest.json")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // 다른 요청은 캐시 우선 + 오프라인 fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === "navigate") {
        return caches.match("/offline.html");
      }
      return caches.match(event.request);
    })
  );
});
```

- 페이지의 모든 **fetch 요청을 가로채서 처리**합니다.
- 특정 요청(manifest 등)은 **네트워크 우선** 처리.
- 일반 요청은 **캐시 우선**, **오프라인 fallback** (`offline.html` 제공).

---

# 📝 전체 요약

- 웹 페이지가 `navigator.serviceWorker.register()`로 등록 요청
- 브라우저가 `service-worker.js`를 다운로드 (파일 변경 여부 확인)
- `install` 이벤트 → 필요한 파일을 캐시에 저장
- `activate` 이벤트 → 오래된 캐시를 삭제하고 새 서비스 워커 활성화
- `fetch` 요청을 서비스 워커가 가로채어 캐시/네트워크를 통해 응답
