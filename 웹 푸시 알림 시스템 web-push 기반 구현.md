## 1. 서비스 워커의 등록 과정

```
+-------------------+             +-------------------+             +-------------------+
| 웹 애플리케이션     |             | 브라우저 엔진       |             | 웹 서버            |
| (클라이언트 JS)    |             | (Navigator API)   |             | (HTTP Server)     |
+--------+----------+             +--------+----------+             +---------+---------+
         |                                 |                                   |
         | 1. navigator.serviceWorker.register('/sw.js')                       |
         +-------------------------------->|                                   |
         |                                 |                                   |
         |                                 | 2. HTTP 요청: GET /sw.js          |
         |                                 +---------------------------------->|
         |                                 |                                   |
         |                                 | 3. HTTP 응답: sw.js 파일 콘텐츠    |
         |                                 |<----------------------------------|
         |                                 |                                   |
         |                                 | 4. 스크립트 파싱 및 컴파일           |
         |                                 |----------------+                  |
         |                                 |                |                  |
         |                                 | 5. 브라우저 내부 저장소에 저장,       |
         |                                 |    스레드 생성 및 실행               |
         |                                 |----------------+                  |
         |                                 |                |                  |
         |                                 | 6. 'install' 이벤트 발생            |
         |                                 |----------------+                  |
         |                                 |                |                  |
         |                                 | 7. 'activate' 이벤트 준비          |
         |                                 |----------------+                  |
         |                                 |                |                  |
         | 8. ServiceWorkerRegistration 객체 반환                               |
         |<--------------------------------|                                   |
         |                                 |                                   |
```

##  2. VAPID 키 생성 및 설정

```
+----------------+     +------------------+     +------------------+
| Web Server     | --> | VAPID Keys       | --> | Web Application  |
| (Application)  |     | - Public Key     |     | (Client-side)    |
+----------------+     | - Private Key    |     +------------------+
                       +------------------+
```

## 3. 구독 프로세스 상세 흐름 (`web-push` 패키지 기반)

```
+-------------------+    +------------------+    +----------------+    +----------------+
| Browser UI        |    | User Agent       |    | Web Server     |    | Push Service   |
| (Permission Pop-up)|    | (Browser JS)     |    | (Application)  |    |                |
+--------+----------+    +--------+---------+    +-------+--------+    +-------+--------+
         |                        |                      |                     |
         |                        | 0. VAPID 공개키 요청  |                     |
         |                        +--------------------->|                     |
         |                        |                      |                     |
         |                        | VAPID 공개키 응답     |                     |
         |                        |<---------------------+                     |
         |   1. Notification.requestPermission()         |                     |
         |<-----------------------+                      |                     |
         |                        |                      |                     |
         | 2. 사용자 허용/거부 선택  |                      |                     |
         +----------------------->|                      |                     |
         |                        |                      |                     |
         |                        | 3. 브라우저 내부에서 키 쌍(p256dh/auth) 생성    |
         |                        |    - p256dh: 공개키 (메시지 암호화용)         |
         |                        |    - auth: 인증 토큰                       |
         |                        |    - 관련 비공개키는 브라우저 내부에 안전하게 저장 |
         |                        |                      |                     |
         |                        | 4. registration.pushManager.subscribe()    |
         |                        |    요청 데이터: VAPID 공개키 + p256dh/auth    |
         |                        +------------------------------------------>|
         |                        |                                           |
         |                        |                                           |
         |                        |           4a. 구독 정보 저장 (푸시 서비스 측) |
         |                        |               - 엔드포인트 URL 생성         |
         |                        |               - p256dh 공개키 저장         |
         |                        |               - auth 토큰 저장             |
         |                        |               - VAPID 공개키와 연결         |
         |                        |                                           |
         |                        |<------------------------------------------+
         |                        | 5. 구독 정보 응답 (엔드포인트 URL 포함)        |
         |                        |    - endpoint: 고유한 푸시 서비스 URL        |
         |                        |    - expirationTime: 구독 만료 시간(선택적)  |
         |                        |    - 암호화 키 정보는 응답에 포함되지 않음      |
         |                        |                                           |
         |                        | 6. 브라우저가 PushSubscription 객체 생성     |
         |                        |    {                                      |
         |                        |      endpoint: "https://fcm.../abc123...",|
         |                        |      keys: {                              |
         |                        |        p256dh: "BNcR...", // 공개키        |
         |                        |        auth: "tBHI..."    // 인증 토큰     |
         |                        |      }                                    |
         |                        |    }                                      |
         |                        |                                           |
         |                        | 7. PushSubscription 객체를 서버로 전송       |
         |                        |    (endpoint URL + p256dh/auth 키 포함)    |
         |                        +--------------------->|                     |
         |                        |                      |                     |
         |                        |                      | 8. DB에 구독 정보 저장 |
         |                        |                      |    - 사용자 ID와 연결  |
         |                        |                      |    - 엔드포인트 저장   |
         |                        |                      |    - p256dh/auth 저장|
         |                        |                      |                     |
         |                        |      9. 저장 완료     |                     |
         |                        |<---------------------+                     |
```

## 4. 푸시 메시지 전송 및 처리 흐름

```
+----------------+    +----------------+    +----------------+    +----------------+
| Web Server     |    | Push Service   |    | User Agent     |    | Service Worker |
| (Application)  |    |                |    | (Browser)      |    |                |
+-------+--------+    +-------+--------+    +-------+--------+    +-------+--------+
        |                     |                     |                     |
        | 1. 푸시 메시지 준비   |                     |                     |
        | - JWT 토큰 생성      |                     |                     |
        | - 메시지 암호화      |                     |                     |
        |                     |                     |                     |
        | 2. HTTPS POST 요청   |                     |                     |
        +-------------------->|                     |                     |
        |                     |                     |                     |
        |                     | 3. JWT 검증         |                     |
        |                     | - VAPID 서명 확인    |                     |
        |                     | - Payload 검증      |                     |
        |                     |                     |                     |
        |                     | 4. 메시지 전달       |                     |
        |                     +-------------------->|                     |
        |                     |                     |                     |
        |                     |                     | 5. 서비스 워커 활성화  |
        |                     |                     | - 브라우저 엔진이 내부적으로 메시지 복호화 수행 |
        |                     |                     | - 구독 시 저장된 비공개키로 데이터 해독 |
        |                     |                     | - auth 토큰으로 메시지 유효성 검증 |
        |                     |                     | - 메시지의 salt와 발신자 공개키 활용 |
        |                     |                     | - 복호화된 데이터와 함께 push 이벤트 트리거 |
        |                     |                     +-------------------->|
        |                     |                     |                     |
        |                     |                     |                     | 6. 메시지 처리
        |                     |                     |                     | - 서비스 워커는 이미 복호화된 데이터 접근
        |                     |                     |                     | - event.data.json()으로 내용 추출
        |                     |                     |                     | - 알림 표시 및 필요한 작업 수행
        |                     |                     |<--------------------+
        |                     |                     | 7. 사용자에게 알림 표시|
        |                     |                     |                     |
```

# 웹 푸시 알림 시스템의 web-push 기반 구현 코드 설명

웹 푸시 알림 시스템의 각 흐름도에 따른 실제 구현 코드를 단계별로 설명하겠습니다.

## 1. 서비스 워커 등록 구현

### 클라이언트 측 구현 (앱의 진입점 JS 파일)

```javascript
// 서비스 워커 지원 확인 및 등록
async function registerServiceWorker() {
  // 브라우저가 서비스 워커를 지원하는지 확인
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // 1. 서비스 워커 등록 요청 (흐름도의 1단계)
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/' // 서비스 워커가 제어할 범위
      });
      
      console.log('🎉 서비스 워커 등록 성공:', registration.scope);
      return registration;
    } catch (error) {
      console.error('😭 서비스 워커 등록 실패:', error);
      return null;
    }
  } else {
    console.warn('⚠️ 이 브라우저는 푸시 알림을 지원하지 않습니다');
    return null;
  }
}

// 페이지 로드 시 서비스 워커 등록
window.addEventListener('load', registerServiceWorker);
```

### 서비스 워커 구현 (/sw.js)

```javascript
// sw.js 파일 - 브라우저에서 다운로드되어 별도 스레드에서 실행됨

// 6. 'install' 이벤트 처리 (흐름도의 6단계)
self.addEventListener('install', event => {
  // 설치 단계에서 필요한 리소스 캐싱
  event.waitUntil(
    caches.open('app-shell-v1').then(cache => {
      console.log('⚙️ 앱 셸 캐싱 중...');
      return cache.addAll([
        '/',
        '/index.html',
        '/styles/main.css',
        '/scripts/app.js',
        '/images/icons/icon-192x192.png'
        // 오프라인 작동에 필요한 기타 정적 자원
      ]);
    })
    .then(() => {
      // 대기 단계 건너뛰기 (선택사항)
      return self.skipWaiting();
    })
  );
});

// 7. 'activate' 이벤트 처리 (흐름도의 7단계)
self.addEventListener('activate', event => {
  console.log('🚀 서비스 워커 활성화 중...');
  
  event.waitUntil(
    Promise.all([
      // 이전 캐시 정리
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName.startsWith('app-') && cacheName !== 'app-shell-v1';
          }).map(cacheName => {
            console.log('🧹 오래된 캐시 삭제 중:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // 열린 페이지에 대한 제어권 즉시 획득
      self.clients.claim()
    ])
  );
});
```

## 2. VAPID 키 생성 및 설정 구현

### 서버 측 구현 (Node.js)

```javascript
// 필요한 패키지 설치: npm install web-push
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// VAPID 키 생성 및 저장 함수
function generateAndSaveVAPIDKeys() {
  const keysPath = path.join(__dirname, 'vapid-keys.json');
  
  // 이미 키가 존재하는지 확인
  if (fs.existsSync(keysPath)) {
    console.log('📋 기존 VAPID 키를 사용합니다');
    return JSON.parse(fs.readFileSync(keysPath));
  }
  
  // 새 VAPID 키 생성
  console.log('🔑 새 VAPID 키 생성 중...');
  const vapidKeys = webpush.generateVAPIDKeys();
  
  // 키를 파일로 저장 (실제 서비스에서는 환경 변수나 보안 저장소 사용 권장)
  fs.writeFileSync(keysPath, JSON.stringify(vapidKeys, null, 2));
  
  return vapidKeys;
}

// VAPID 키 생성 및 웹푸시 설정
const vapidKeys = generateAndSaveVAPIDKeys();

// 웹푸시 서비스 설정
webpush.setVapidDetails(
  'mailto:admin@example.com', // 발신자 연락처 (문제 발생 시 푸시 서비스가 연락)
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// VAPID 공개키 제공 API 엔드포인트
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});
```

## 3. 구독 프로세스 구현

### 클라이언트 측 구현

```javascript
// 푸시 알림 구독 함수
async function subscribeToPushNotifications() {
  try {
    // 서비스 워커 등록 확인
    const registration = await navigator.serviceWorker.ready;
    
    // 0. 서버로부터 VAPID 공개키 요청 (흐름도의 0단계)
    const response = await fetch('/api/vapid-public-key');
    const { publicKey } = await response.json();
    
    // VAPID 공개키를 Uint8Array로 변환 (브라우저 요구 형식)
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    
    // 1-2. 알림 권한 요청 (흐름도의 1-2단계)
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다');
    }
    
    // 3-4. 푸시 서비스 구독 (흐름도의 3-4단계)
    // 내부적으로 브라우저는 p256dh/auth 키 쌍을 생성합니다
    console.log('🔐 푸시 구독 생성 중...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,  // 모든 푸시는 사용자에게 표시되어야 함
      applicationServerKey    // VAPID 공개키
    });
    
    console.log('📲 구독 정보:', JSON.stringify(subscription));
    
    // 7. 구독 정보 서버로 전송 (흐름도의 7단계)
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('😭 푸시 알림 구독 실패:', error);
    return null;
  }
}

// 구독 정보를 서버로 전송하는 함수
async function sendSubscriptionToServer(subscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userInfo: {
          // 사용자 식별 정보 (필요한 경우)
          userId: getUserId(), // 현재 로그인한 사용자 ID
          userAgent: navigator.userAgent
        }
      }),
    });

    if (!response.ok) {
      throw new Error('서버 응답 오류: ' + response.status);
    }

    console.log('🎉 구독 정보가 서버에 성공적으로 저장되었습니다');
    return await response.json();
  } catch (error) {
    console.error('😭 구독 정보 서버 전송 실패:', error);
    throw error;
  }
}

// 사용자 동의 시 푸시 구독 실행 (버튼 클릭 이벤트 등에 연결)
document.getElementById('push-subscribe-button').addEventListener('click', subscribeToPushNotifications);
```

### 서버 측 구현 (Node.js)

```javascript
// 구독 정보 저장 API 엔드포인트
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { subscription, userInfo } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: '유효한 구독 정보가 아닙니다' });
    }

    // 8. 데이터베이스에 구독 정보 저장 (흐름도의 8단계)
    // 실제 앱에서는 MongoDB, PostgreSQL 등 데이터베이스 사용
    await db.subscriptions.upsert({
      userId: userInfo.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userInfo.userAgent,
      createdAt: new Date()
    });

    // 9. 저장 완료 응답 (흐름도의 9단계)
    return res.status(201).json({ success: true, message: '구독 정보가 저장되었습니다' });
  } catch (error) {
    console.error('구독 저장 오류:', error);
    return res.status(500).json({ error: '서버 오류로 구독 정보를 저장할 수 없습니다' });
  }
});
```

## 4. 푸시 메시지 전송 및 처리 구현

### 서버 측 구현 (Node.js)

```javascript
// 특정 사용자에게 푸시 알림 전송
async function sendPushNotification(userId, notificationData) {
  try {
    // 사용자의 구독 정보 조회
    const subscriptions = await db.subscriptions.findByUserId(userId);
    
    if (!subscriptions || subscriptions.length === 0) {
      throw new Error(`사용자 ID ${userId}의 구독 정보가 없습니다`);
    }
    
    // 각 구독 정보에 대해 푸시 메시지 전송
    const results = await Promise.all(subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      // 1. 푸시 메시지 준비 (흐름도의 1단계)
      // web-push 라이브러리가 JWT 토큰 생성 및 메시지 암호화를 내부적으로 처리
      const payload = JSON.stringify(notificationData);
      
      try {
        // 2. HTTPS POST 요청 전송 (흐름도의 2단계)
        const result = await webpush.sendNotification(
          subscription, 
          payload,
          {
            TTL: 60 * 60, // 푸시 메시지 수명 (초 단위, 1시간)
            urgency: 'high', // 우선순위 (high, normal, low)
            topic: notificationData.topic || 'general' // 주제 (동일 주제는 중복 알림 방지)
          }
        );
        
        return { success: true, statusCode: result.statusCode, subscription };
      } catch (error) {
        // 구독이 만료되었거나 더 이상 유효하지 않은 경우
        if (error.statusCode === 404 || error.statusCode === 410) {
          // 데이터베이스에서 만료된 구독 삭제
          await db.subscriptions.deleteByEndpoint(subscription.endpoint);
          console.log(`만료된 구독 삭제: ${subscription.endpoint}`);
          return { success: false, error: 'subscription-expired', subscription };
        }
        
        return { success: false, error: error.message, subscription };
      }
    }));
    
    return results;
  } catch (error) {
    console.error('푸시 알림 전송 실패:', error);
    throw error;
  }
}

// 푸시 알림 전송 API 엔드포인트 예시
app.post('/api/push/send', async (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    if (!userId || !notification || !notification.title) {
      return res.status(400).json({ error: '유효하지 않은 요청 데이터' });
    }
    
    // 푸시 알림 전송
    const results = await sendPushNotification(userId, notification);
    
    return res.json({ success: true, results });
  } catch (error) {
    console.error('푸시 알림 전송 API 오류:', error);
    return res.status(500).json({ error: '푸시 알림 전송 실패' });
  }
});
```

### 클라이언트 측 서비스 워커 구현 (sw.js)

```javascript
// push 이벤트 리스너 - 푸시 메시지 수신 처리
// 5-6. 메시지 처리 (흐름도의 5-6단계)
self.addEventListener('push', function(event) {
  console.log('📬 푸시 메시지 수신:', event);
  
  // 이벤트가 데이터를 포함하는지 확인
  if (!event.data) {
    console.log('데이터가 없는 푸시 메시지입니다');
    return;
  }
  
  // 이미 복호화된 데이터에 접근 (브라우저가 복호화를 자동으로 처리)
  let notification;
  try {
    // JSON 형식의 데이터 추출
    notification = event.data.json();
  } catch (e) {
    // JSON 파싱 실패 시 텍스트로 시도
    notification = {
      title: '새 알림',
      body: event.data.text(),
      data: { url: '/' }
    };
  }
  
  // wait until을 사용하여 Service Worker가 알림을 표시할 때까지 종료되지 않도록 함
  event.waitUntil(
    // 7. 사용자에게 알림 표시 (흐름도의 7단계)
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/images/icons/icon-192x192.png',
      badge: notification.badge || '/images/icons/badge-72x72.png',
      vibrate: notification.vibrate || [100, 50, 100],
      data: notification.data || { url: '/' },
      actions: notification.actions || [],
      tag: notification.tag || 'default', // 같은 태그는 알림 중복 방지
      renotify: notification.renotify || false, // 같은 태그라도 재알림 여부
      requireInteraction: notification.requireInteraction || false, // 사용자 인터랙션 필요 여부
      silent: notification.silent || false // 소리 알림 여부
    })
  );
});

// notificationclick 이벤트 리스너 - 알림 클릭 처리
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ 알림 클릭됨:', event.notification);
  
  // 알림 닫기
  event.notification.close();
  
  // 알림 데이터에서 URL 가져오기
  const url = event.notification.data && event.notification.data.url ? 
              event.notification.data.url : 
              '/';
  
  // 클릭 작업 처리 (예: 특정 URL 열기)
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // 이미 열려있는 창이 있는지 확인
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          // 이미 열려있는 창에 포커스
          return client.focus();
        }
      }
      
      // 열려있는 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// notificationclose 이벤트 리스너 - 알림 닫기 처리
self.addEventListener('notificationclose', function(event) {
  console.log('👋 알림 닫힘:', event.notification);
  
  // 알림 닫기 이벤트에 대한 추가 처리가 필요하면 여기에 구현
  // 예: 분석 데이터 전송 등
});
```

## 구현 시 주요 고려사항

### 1. 보안 고려사항
- HTTPS 환경에서만 동작 (localhost 제외)
- VAPID 비공개키는 안전하게 보관
- 모든 사용자 입력 데이터 검증

### 2. 오류 처리
- 만료된 구독 정보 자동 정리
- 브라우저 호환성 검사
- 알림 권한 상태 모니터링

### 3. 사용자 경험
- 알림 권한 요청 시점 신중하게 선택
- 각 알림에 적절한 액션 제공
- 알림 클릭 시 관련 페이지로 정확히 이동

### 4. 성능 최적화
- 불필요한 알림 배치 처리
- 서비스 워커 업데이트 전략 구현
- 푸시 메시지 크기 최소화 (4KB 제한)

이 구현 코드는 흐름도에 맞춰 웹 푸시 알림 시스템의 전체 과정을 구현합니다. 실제 프로젝트에 적용 시 환경과 요구사항에 맞게 조정이 필요합니다.









