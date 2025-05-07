// @ts-nocheck
/**
 * 서비스 워커 알고리즘
 * 
 * 1. 초기화 및 설정
 *    - 캐시 이름 정의 (CACHE_NAME)
 *    - 캐시할 필수 자산 목록 정의 (CACHE_ASSETS)
 * 
 * 2. 설치 단계 (install 이벤트)
 *    - 서비스 워커가 처음 등록될 때 실행
 *    - 캐시 스토리지를 열고 필수 자산을 미리 캐싱
 *    - self.skipWaiting()을 호출하여 대기 단계를 건너뛰고 즉시 활성화
 * 
 * 3. 활성화 단계 (activate 이벤트)
 *    - 새 서비스 워커가 활성화될 때 실행
 *    - 이전 버전의 캐시를 정리 (캐시 이름이 CACHE_NAME과 다른 경우 삭제)
 *    - clients.claim()을 호출하여 모든 클라이언트에 대한 제어 권한 획득
 * 
 * 4. 네트워크 요청 처리 (fetch 이벤트)
 *    - 리소스 유형별로 서로 다른 캐싱 전략 적용:
 *      a. manifest.json: 네트워크 우선, 실패 시 캐시 폴백
 *      b. 정적 자산 (이미지, CSS, JS, 폰트): 캐시 우선, 캐시 미스 시 네트워크, 백그라운드에서 캐시 업데이트
 *      c. 네비게이션 요청 (HTML): 네트워크 우선, 실패 시 오프라인 페이지 제공
 *      d. 기타 요청: 네트워크 우선, 성공한 응답은 캐시에 저장, 실패 시 캐시 폴백
 * 
 * 5. 푸시 알림 처리 (push 이벤트)
 *    - 서버에서 보낸 푸시 메시지 수신 및 처리
 *    - 메시지 데이터 파싱 (JSON 또는 텍스트)
 *    - 사용자에게 알림 표시 (title, body, icon, 액션 등 설정)
 * 
 * 6. 알림 상호작용 처리 (notificationclick 이벤트)
 *    - 사용자가 알림을 클릭했을 때 처리
 *    - 알림 닫기 및 해당 URL로 이동 (지정된 URL이 없으면 홈페이지로 이동)
 * 
 * 7. 클라이언트와의 통신 (message 이벤트)
 *    - 웹 페이지로부터 메시지 수신 및 응답
 *    - 테스트 메시지 수신 시 서비스 워커 상태 응답
 */

/**
 * fetch 이벤트에 대한 추가 설명
 * 
 * fetch 이벤트는 웹 애플리케이션에서 발생하는 모든 네트워크 HTTP 요청을 가로채는 이벤트입니다.
 * 이는 다음을 포함합니다:
 * - 페이지 탐색(HTML 요청)
 * - 이미지, CSS, JavaScript 파일 등의 정적 자원 요청
 * - fetch() API를 통한 AJAX 요청
 * - XMLHttpRequest를 통한 요청
 * 
 * 서비스 워커의 fetch 이벤트 핸들러에서 event.respondWith() 메서드를 사용하면
 * 브라우저의 기본 네트워크 요청을 중단시키고, 서비스 워커가 직접 응답을 제공할 수 있습니다.
 * 이를 통해 다양한 캐싱 전략을 구현할 수 있습니다:
 * - 캐시 우선 전략 (Cache First)
 * - 네트워크 우선 전략 (Network First)
 * - 스테일-와일-리밸리데이트 전략 (Stale While Revalidate)
 * - 캐시 전용 전략 (Cache Only)
 * - 네트워크 전용 전략 (Network Only)
 */

/**
 * 오류 수정 및 개선 사항:
 * 
 * 1. 네트워크 타임아웃 오류(408) 해결:
 *    - 네트워크 요청 시 타임아웃 설정 추가
 *    - CORS 이슈가 있는 외부 도메인(Google Fonts, SKT API 등) 처리 개선
 * 
 * 2. chrome-extension 스킴 캐싱 오류 해결:
 *    - HTTP/HTTPS 프로토콜만 캐싱하도록 제한
 *    - 캐시 저장 전 URL 스킴 검증
 * 
 * 3. 캐시 작업 실패 처리:
 *    - 캐시 작업 시 오류 처리 로직 추가
 *    - 요청 타임아웃 설정으로 무한 대기 방지
 */

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

// 타임아웃 설정으로 fetch 요청 제한
const timeoutFetch = (request, timeoutMs = 8000) => {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// URL이 캐시 가능한지 확인하는 함수
const isCacheableRequest = (request) => {
  try {
    const url = new URL(request.url);
    
    // HTTP/HTTPS 프로토콜만 캐싱
    if (!url.protocol.startsWith('http')) {
      return false;
    }
    
    // API 요청이나 동적 데이터는 캐시하지 않음
    if (url.pathname.startsWith('/api/')) {
      return false;
    }
    
    // CORS 이슈가 있는 외부 도메인은 캐싱하지 않음
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'apis.openapi.sk.com',
      'dapi.kakao.com',
      'openapi.naver.com'
    ];
    
    if (externalDomains.some(domain => url.hostname.includes(domain))) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Service Worker] URL 검증 오류:', error);
    return false;
  }
};

// 안전한 캐시 저장 함수
const safeCachePut = async (cache, request, response) => {
  try {
    if (!isCacheableRequest(request)) {
      return false;
    }
    
    await cache.put(request, response);
    return true;
  } catch (error) {
    console.error('[Service Worker] 캐시 저장 오류:', error);
    return false;
  }
};

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

// 페치 이벤트 - 개선된 캐시 전략 적용
self.addEventListener("fetch", (event) => {
  // 요청이 캐시 가능하지 않으면 기본 처리로 넘김
  if (!isCacheableRequest(event.request)) {
    return;
  }

  // manifest.json 요청에 대해서는 항상 네트워크 우선
  if (event.request.url.includes("manifest.json")) {
    event.respondWith(
      timeoutFetch(event.request, 5000).catch(() => {
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
          timeoutFetch(event.request, 5000).then((response) => {
            if (response && response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                safeCachePut(cache, event.request, response.clone());
              });
            }
          }).catch(() => {/* 실패 무시 */});
          return cachedResponse;
        }

        // 캐시에 없으면 네트워크 요청
        return timeoutFetch(event.request, 5000).then((response) => {
          if (!response || !response.ok) {
            throw new Error('Network request failed');
          }
          
          // 네트워크 응답을 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            safeCachePut(cache, event.request, responseToCache);
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
      timeoutFetch(event.request, 5000).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // 그 외의 요청은 네트워크 시도 후 캐시 폴백
  event.respondWith(
    timeoutFetch(event.request, 5000)
      .then((response) => {
        // 성공한 응답은 캐시에 저장
        if (response && response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            safeCachePut(cache, event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// 푸시 이벤트 - 권한 체크 수정
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

    // permissionState는 사용하지 않음 - 서비스 워커 내에서는 항상 권한이 있다고 가정
    // 푸시 이벤트는 권한이 있을 때만 발생하기 때문
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
