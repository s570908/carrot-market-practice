// libs/client/pushUtils.ts
import { subscribePush } from '@/apiLibs/push';

// Base64 문자열을 Uint8Array로 변환하는 유틸리티 함수
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 푸시 구독을 초기화하고 서버와 동기화하는 함수
 * 
 * 다음 세 가지 상황에서 재구독 처리를 수행합니다:
 * 1. 서비스 워커가 없는 경우: 브라우저 재시작이나 데이터 삭제로 서비스 워커 등록이 사라졌을 때
 * 2. 푸시 구독이 없는 경우: 사용자가 알림 권한을 취소했다가 다시 허용한 경우 등
 * 3. 서버에서 구독이 유효하지 않은 경우: 만료(EXPIRED)나 비활성(INACTIVE) 상태로 표시된 경우
 */
export async function initializePushSubscription(): Promise<PushSubscription | null> {
  // 브라우저 환경 및 기능 지원 여부 확인
  if (typeof window === "undefined" || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push notifications are not supported in this environment");
    return null;
  }

  try {
    // 서비스 워커 등록 또는 기존 등록 확인
    let registration = await navigator.serviceWorker.getRegistration();
    
    // 1. 서비스 워커가 없는 경우: 브라우저 재시작이나 데이터 삭제로 서비스 워커 등록이 사라졌을 때
    if (!registration) {
      console.log("Registering new service worker...");
      registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log("Service worker registered successfully");
    }
    
    // 서비스 워커가 준비될 때까지 대기
    await navigator.serviceWorker.ready;

    if (!registration) {
      throw new Error("Service worker registration failed");
    }

    // 기존 푸시 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    // 2. 푸시 구독이 없는 경우: 사용자가 알림 권한을 취소했다가 다시 허용한 경우 등
    if (!subscription) {
      // 새로운 푸시 구독 생성
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("VAPID public key is not configured");
      }

      // 🔍 디버깅: 상세 상태 확인
      console.log("=== Push Subscribe 디버깅 시작 ===");
      console.log("1. 알림 권한 상태:", Notification.permission);
      console.log("2. 서비스 워커 상태:", registration.active?.state);
      console.log("3. VAPID Public Key 길이:", publicKey.length);
      console.log("4. VAPID Public Key (앞 20자):", publicKey.substring(0, 20) + "...");
      
      // 알림 권한 확인 및 요청
      let permission = Notification.permission;
      
      if (permission === 'default') {
        console.log("알림 권한이 'default' 상태입니다. 권한을 요청합니다...");
        permission = await Notification.requestPermission();
        console.log("권한 요청 결과:", permission);
      }
      
      if (permission === 'denied') {
        console.error("❌ 알림 권한이 거부되었습니다.");
        throw new Error("알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.");
      }
      
      if (permission !== 'granted') {
        console.error("❌ 알림 권한이 'granted'가 아님:", permission);
        throw new Error(`알림 권한이 필요합니다. 현재 상태: ${permission}`);
      }
      
      console.log("✅ 알림 권한 확인됨: granted");

      // 서비스 워커 활성화 상태 확인
      if (!registration.active) {
        console.error("❌ 서비스 워커가 활성화되지 않음");
        console.log("   - installing:", registration.installing?.state);
        console.log("   - waiting:", registration.waiting?.state);
        throw new Error("서비스 워커가 아직 활성화되지 않았습니다.");
      }

      console.log("Creating new push subscription...");
      try {
        const convertedKey = urlBase64ToUint8Array(publicKey);
        console.log("5. 변환된 applicationServerKey 길이:", convertedKey.length);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as BufferSource,
        });
        console.log("✅ pushManager.subscribe 성공:", subscription);
        console.log("  - endpoint:", subscription.endpoint);
      } catch (subscribeError: any) {
        console.error("❌ pushManager.subscribe 실패:", subscribeError);
        console.error("   - 에러 이름:", subscribeError.name);
        console.error("   - 에러 메시지:", subscribeError.message);
        
        // 추가 진단 정보
        if (subscribeError.name === 'AbortError') {
          console.error("🔍 AbortError 가능한 원인:");
          console.error("   1. VAPID 키가 잘못된 형식일 수 있음");
          console.error("   2. 브라우저 푸시 서비스(FCM)에 연결할 수 없음");
          console.error("   3. 네트워크 문제 또는 방화벽 차단");
          console.error("   4. 브라우저 푸시 서비스 일시적 장애");
        }
        
        throw subscribeError;
      }
    }

    // 구독 정보를 서버에 전송
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      browserId: navigator.userAgent,
    };

    await subscribePush(subscriptionData);
    console.log("Push subscription initialized successfully");

    return subscription;
  } catch (error) {
    console.error("Failed to initialize push subscription:", error);
    return null;
  }
}

// 서버에 구독 유효성 확인 요청
import { verifyPushSubscription } from '@/apiLibs/push';

/**
 * 서버에 구독 유효성을 확인하는 함수
 * 서비스워커나 구독이 없으면 false 반환, 서버에 유효한지 확인하여 결과 반환
 */
export async function checkSubscriptionWithServer(): Promise<boolean> {
  try {
    // 공통 유틸리티 함수 사용하여 중복 로직 제거
    const { registration, subscription } = await getCurrentRegistrationAndSubscription();
    if (!registration || !subscription) return false;
    
    // apiLibs/push.ts의 함수 사용하여 응답 객체 가져오기
    const result = await verifyPushSubscription(subscription.endpoint);
    return result.isValid;
  } catch (error) {
    console.error('Error checking subscription with server:', error);
    return false;
  }
}

/**
 * 구독 상태를 확인하고 필요시 재생성하는 함수
 * 
 * 다음 세 가지 상황에서 푸시 구독을 재생성합니다:
 * 1. 서비스 워커 등록이 없는 경우
 * 2. 푸시 구독 객체가 없는 경우  
 * 3. 서버에서 구독이 유효하지 않다고 응답한 경우(이 경우 기존 구독을 해제 후 재생성)
 */
export async function checkAndRefreshPushSubscriptionEnhanced(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      await initializePushSubscription();
      return;
    }
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      await initializePushSubscription();
      return;
    }    // 3. 서버에서 구독이 유효하지 않은 경우(EXPIRED/INACTIVE 등)
    const isValidOnServer = await checkSubscriptionWithServer();
    if (!isValidOnServer) {
      console.log("Server reports subscription is invalid, recreating...");
      await subscription.unsubscribe();  // 기존 구독 해제
      await initializePushSubscription(); // 새 구독 생성
    }
  } catch (error) {
    console.error('Error in enhanced subscription check:', error);
  }
}

/**
 * 현재 브라우저의 서비스 워커 등록과 푸시 구독을 가져오는 유틸리티 함수
 * @returns 서비스 워커 등록과 푸시 구독 (없으면 null)
 */
export async function getCurrentRegistrationAndSubscription(): Promise<{
  registration: ServiceWorkerRegistration | null;
  subscription: PushSubscription | null;
}> {
  if (typeof window === "undefined" || !('serviceWorker' in navigator)) {
    return { registration: null, subscription: null };
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { registration: null, subscription: null };
    }
    
    const subscription = await registration.pushManager.getSubscription();
    return { 
      registration, 
      subscription: subscription || null 
    };
  } catch (error) {
    console.error('Error getting registration and subscription:', error);
    return { registration: null, subscription: null };
  }
}

// 주기적 모니터링 및 포커스 시 확인
export function startPushSubscriptionMonitoring(): void {
  if (typeof window === 'undefined') return;
  // 앱 시작 시 한 번 확인
  checkAndRefreshPushSubscriptionEnhanced();
  // 포커스 시 확인
  window.addEventListener('focus', () => {
    checkAndRefreshPushSubscriptionEnhanced();
  });
  // 5분마다 주기적으로 확인
  const intervalId = setInterval(() => {
    checkAndRefreshPushSubscriptionEnhanced();
  }, 5 * 60 * 1000);
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });
}

/**
 * 만료된 구독을 처리하고 갱신하는 함수
 * 
 * 1. 기존 구독 해제
 * 2. 새 구독 생성
 * 3. 서버에 새 구독 정보 전송
 */
export async function handleExpiredSubscription() {
  try {
    // 1. 기존 구독 해제
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    // 2. 새 구독 생성
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource
    });

    // 3. 서버에 새 구독 정보 전송
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: newSubscription,
        action: 'renew'
      })
    });

    return { success: true, subscription: newSubscription };
  } catch (error) {
    console.error('구독 갱신 실패:', error);
    return { success: false, error };
  }
}

// 주기적으로 구독 상태 확인
export async function checkSubscriptionStatus() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // 구독이 없으면 새로 생성
      return await handleExpiredSubscription();
    }

    // 구독 상태 테스트 (서버에 테스트 요청 전송)
    const testResult = await fetch('/api/push-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });

    if (!testResult.ok) {
      // 테스트 실패 시 구독 갱신
      return await handleExpiredSubscription();
    }

    return { success: true, subscription };
  } catch (error) {
    console.error('구독 상태 확인 실패:', error);
    return { success: false, error };
  }
}
