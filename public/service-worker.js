// @ts-nocheck
// 캐시 이름 정의
const CACHE_NAME = "soy-market-v1";

// 캐시할 파일 목록
const CACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/soy-bean-192-192.png",
  "/icons/soy-bean-512-512.png",
  "/offline.html", // 오프라인 페이지 추가
];

// 설치 이벤트 - 캐시 초기화
self.addEventListener("install", (event) => {
  console.log("[Service Worker] 설치 중...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] 캐시 생성");
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] 활성화 중...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[Service Worker] 오래된 캐시 삭제:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 페치 이벤트 - manifest.json은 네트워크에서만 가져오도록 수정
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

  // 다른 요청에 대한 기존 처리
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === "navigate") {
        // 네비게이션 요청이 실패하면 오프라인 페이지 제공
        return caches.match("/offline.html");
      }
      // 다른 리소스는 캐시에서 찾기
      return caches.match(event.request);
    })
  );
});

// 푸시 이벤트
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
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

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// 알림 클릭 이벤트
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

// 메시지 수신 이벤트
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

console.log("[Service Worker] 서비스 워커 스크립트 로드됨");
