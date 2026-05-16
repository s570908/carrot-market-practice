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

// 캐시 이름 정의
const CACHE_NAME = "soy-market-v1";

// 캐시할 파일 목록
const CACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/soy-bean-192-192.png",
  "/icons/soy-bean-512-512.png",
  "/offline.html", // 오프라인 페이지 추가
  "/dev-server-offline.html", // 개발 서버 중지 시 표시할 페이지 추가
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

// 408 타임아웃 에러 발생 원인 분석
// 408 타임아웃 에러가 발생했던 주요 원인들을 설명하겠습니다:

// 서비스 워커의 간섭

// 서비스 워커가 외부 리소스 요청을 가로채서 처리하려고 시도
// 처리 과정에서 지연이 발생하여 요청 시간 초과
// Google Fonts와 TMap API와 같은 외부 리소스는 서비스 워커가 처리하기에 부적합
// 리소스 로딩 순서 문제

// 리소스 로딩이 최적화되지 않아 병목 현상 발생
// DNS 조회, TCP 연결, TLS 협상 등이 각각 시간 소요

// 특히, 여러 외부 리소스를 동시에 요청할 때 발생 가능성 높음

// 해결방안: 서비스 워커에서 외부 리소스 요청을 가로채지 않도록 수정

// 페치 이벤트 - 개선된 캐시 전략 적용
self.addEventListener("fetch", (event) => {
  // 외부 리소스는 서비스 워커가 처리하지 않도록 우회
  try {
    const url = new URL(event.request.url);
    
    // 서비스 워커가 처리하지 않을 도메인 목록
    const bypassDomains = [
      'fonts.googleapis.com',    // Google Fonts CSS
      'fonts.gstatic.com',      // Google Fonts 파일
      'apis.openapi.sk.com',    // TMap API
      'tmap.co.kr'              // TMap 관련 리소스
    ];

    if (bypassDomains.some(domain => url.hostname.includes(domain))) {
      return; // 브라우저의 기본 동작으로 처리
    }
  } catch (error) {
    console.error('[Service Worker] URL 파싱 에러:', error);
    return; // 에러 발생 시 서비스 워커가 처리하지 않음
  }

  // URL이 캐시 가능한지 확인하는 함수
  const isCacheableRequest = (request) => {
    const url = new URL(request.url);
    
    // chrome-extension:, data:, blob: 등의 스킴은 캐시할 수 없음
    if (!url.protocol.startsWith('http')) {
      return false;
    }
    
    // API 요청이나 동적 데이터는 캐시하지 않음 (선택적)
    if (url.pathname.startsWith('/api/')) {
      return false;
    }
    
    return true;
  };

  // 요청이 캐시 가능하지 않으면 기본 처리로 넘김
  if (!isCacheableRequest(event.request)) {
    return;
  }

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
            if (response && response.ok && isCacheableRequest(event.request)) {
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
          
          // 네트워크 응답을 캐시에 저장 (캐시 가능한 요청만)
          if (isCacheableRequest(event.request)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
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

  // 네비게이션 요청 (HTML 페이지)에 대해 네트워크 우선 전략 - 개선된 오류 처리
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.log('[Service Worker] Navigation fetch failed:', error);
          
          // 개발 서버 실행 중지 여부 확인
          const url = new URL(event.request.url);
          const isDevelopmentServer = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
          
          if (isDevelopmentServer) {
            // 개발 서버에 대한 요청이 실패한 경우 - 서버 중지 가능성 높음
            return caches.match('/dev-server-offline.html')
              .then(response => response || caches.match('/offline.html'));
          } else {
            // 일반적인 네트워크 오류 - 표준 오프라인 페이지
            return caches.match('/offline.html');
          }
        })
    );
    return;
  }

  // 그 외의 요청은 네트워크 시도 후 캐시 폴백
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공한 응답은 캐시에 저장 (캐시 가능한 요청만)
        if (response && response.ok && isCacheableRequest(event.request)) {
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
      requireInteraction: data.requireInteraction === true,    // 사용자가 직접 닫거나 클릭할 때까지 유지
    };

    // permissionState는 사용하지 않음 - 서비스 워커 내에서는 항상 권한이 있다고 가정
    // 푸시 이벤트는 권한이 있을 때만 발생하기 때문
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// 알림 클릭 이벤트 - 간소화된 버전
self.addEventListener("notificationclick", (event) => {
  // 사용자가 클릭했을 때만 알림 닫기
  event.notification.close();

  if (event.action === "view" && event.notification.data) {
    const data = event.notification.data;
    console.log("[Service Worker] 알림 클릭:", data);

    // 클릭한 알림의 URL
    const urlToOpen = data.url || "/";

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(clientList => {
        console.log("[Service Worker] 열린 클라이언트 수:", clientList.length);
        
        // 1. 동일한 URL을 가진 탭 찾기
        const matchingClients = clientList.filter(client => {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen, self.location.origin);
          
          console.log("[Service Worker] URL 비교:", {
            client: clientUrl.pathname,
            target: targetUrl.pathname,
            match: clientUrl.pathname === targetUrl.pathname
          });
          
          return clientUrl.pathname === targetUrl.pathname;
        });
        
        // 동일한 URL을 가진 탭이 있으면 해당 탭으로 포커스
        if (matchingClients.length > 0) {
          console.log("[Service Worker] 동일한 URL의 탭 발견:", matchingClients[0].url);
          return matchingClients[0].focus();
        }
        
        // 2. 동일한 URL의 탭이 없으면 새 탭 열기
        console.log("[Service Worker] 새 탭 열기:", urlToOpen);
        return clients.openWindow(urlToOpen);
      })
    );
  } else if (event.action === "close") {
    console.log("[Service Worker] 알림 닫기 버튼 클릭");
  } else {
    // 알림 영역 클릭 (액션 버튼 아님)
    const data = event.notification.data || {};
    const urlToOpen = data.url || "/";
    
    console.log("[Service Worker] 알림 영역 클릭, 데이터:", data);

    // 알림 영역 클릭 시에도 동일한 로직 적용
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(clientList => {
        // 동일한 URL을 가진 탭 찾기
        const matchingClients = clientList.filter(client => {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen, self.location.origin);
          return clientUrl.pathname === targetUrl.pathname;
        });
        
        // 동일한 URL을 가진 탭이 있으면 해당 탭으로 포커스
        if (matchingClients.length > 0) {
          return matchingClients[0].focus();
        }
        
        // 동일한 URL의 탭이 없으면 새 탭 열기
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// 메시지 수신 이벤트
self.addEventListener("message", (event) => {
  console.log("[Service Worker] 메시지 수신:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

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
