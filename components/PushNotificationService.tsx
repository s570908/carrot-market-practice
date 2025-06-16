import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVapidKey, subscribePush } from '@/apiLibs/push';
import { getMe } from '@/apiLibs/users';
import { useRouter } from 'next/router';

// 서비스 워커 등록 및 푸시 구독 관리 컴포넌트
const PushNotificationService = () => {
  const router = useRouter();
  // Next.js 라우터 훅 - 현재 경로 정보를 얻기 위해 사용
  
  const isEnterPage = router.pathname === '/enter';
  // 현재 페이지가 로그인 페이지인지 확인하는 불린 값
  // 로그인 페이지에서는 푸시 알림 서비스를 실행하지 않기 위함

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  // 브라우저의 푸시 구독 객체를 저장하는 상태
  // 푸시 알림을 받기 위한 구독 정보 (endpoint, keys 등 포함)

  // getMe() 함수를 사용하여 세션 확인 (리다이렉트 없음)
  const { data: userData } = useQuery({
    queryKey: ["pushNotificationSession"],
    // React Query 캐시 키 - 다른 쿼리와 충돌하지 않도록 고유한 키 사용
    
    queryFn: getMe,
    // API 호출 함수 - /api/users/me 엔드포인트를 호출하여 사용자 정보 획득
    
    staleTime: 30000, // 30초 동안 캐시
    // 데이터가 30초 동안 신선한 것으로 간주 (재요청하지 않음)
    
    refetchOnWindowFocus: false,
    // 브라우저 창이 포커스될 때 자동으로 다시 요청하지 않음
    
    refetchOnReconnect: false,
    // 네트워크 재연결 시 자동으로 다시 요청하지 않음
    
    retry: false, // 실패 시 재시도 하지 않음
    // API 호출 실패 시 자동 재시도를 하지 않음 (성능 최적화)
    
    enabled: typeof window !== 'undefined' && !isEnterPage,
    // 쿼리 실행 조건:
    // 1. 클라이언트 사이드에서만 실행 (typeof window !== 'undefined')
    // 2. 로그인 페이지가 아닐 때만 실행 (!isEnterPage)
    // 🔑 이 부분이 중요: 로그인 페이지에서는 사용자 정보 조회하지 않음
  });

  // 로그인 상태 확인 (리다이렉트 없이 단순 확인만)
  const isLoggedIn = userData?.ok === true;
  // API 응답에서 ok 필드가 true인지 확인하여 로그인 상태 판단
  
  const user = userData;
  // 사용자 정보 객체 추출 (로그인된 경우에만 존재)

  // Base64 문자열을 Uint8Array로 변환하는 유틸리티 함수
  const urlBase64ToUint8Array = (base64String: string) => {
    // VAPID 공개 키를 브라우저에서 사용할 수 있는 형태로 변환
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    // Base64 패딩 문자 추가 (Base64는 4의 배수 길이여야 함)
    
    const base64 = (base64String + padding)
      .replace(/-/g, '+')    // URL-safe Base64의 '-'를 표준 Base64의 '+'로 변환
      .replace(/_/g, '/');   // URL-safe Base64의 '_'를 표준 Base64의 '/'로 변환
      
    const rawData = window.atob(base64);
    // Base64 문자열을 바이너리 문자열로 디코딩
    
    const outputArray = new Uint8Array(rawData.length);
    // 결과를 저장할 Uint8Array 생성
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
      // 각 문자의 ASCII 코드를 배열에 저장
    }
    
    return outputArray;
    // VAPID 키로 사용할 수 있는 Uint8Array 반환
  };

  // 서비스 워커 등록 및 활성화 함수 (기존 _app.tsx 코드와 통합)
  const registerServiceWorker = async () => {
    try {
      // 이미 등록된 서비스 워커가 있는지 확인
      const registrations = await navigator.serviceWorker.getRegistrations();
      // 현재 등록된 모든 서비스 워커 목록을 가져옴
      
      if (registrations.length === 0) {
        // 등록된 서비스 워커가 없을 경우 새로 등록
        const registration = await navigator.serviceWorker.register('/service-worker.js', { 
          scope: "/",
          // 서비스 워커의 범위를 루트(/)로 설정 (전체 사이트에서 동작)
          // 서비스 워커에 푸시 기능도 포함되어 있음을 명시적으로 주석으로 표시
          // 이 서비스 워커는 캐싱, 오프라인 지원, 푸시 알림 등 모든 기능 담당
        });
        
        console.log("서비스 워커 등록 성공:", registration.scope);
        
        // 등록 후 새로고침하여 서비스 워커가 활성화되도록 함
        if (registration.installing) {
          // 서비스 워커가 설치 중인 경우
          registration.installing.addEventListener("statechange", (e) => {
            if ((e.target as any).state === "activated") {
              console.log("서비스 워커 활성화됨");
              // 서비스 워커가 활성화되면 로그 출력
            }
          });
        }
        
        return registration;
        // 새로 등록된 ServiceWorkerRegistration 객체 반환
      } else {
        console.log("이미 등록된 서비스 워커가 있습니다:", registrations);
        return registrations[0]; // 첫 번째 등록된 서비스 워커 반환
        // 기존에 등록된 서비스 워커 재사용
      }
    } catch (error) {
      console.error("서비스 워커 등록 실패:", error);
      throw error;
      // 에러를 다시 던져서 호출하는 곳에서 처리할 수 있도록 함
    }
  };

  // 사용자의 구독 등록/확인 로직
  useEffect(() => {
    // Enter 페이지에서는 조기 리턴 (미들웨어와 일관성 유지)
    if (isEnterPage) {
      // 로그인 페이지에서는 푸시 알림 설정을 하지 않음
      // 미들웨어에서 공개 페이지로 설정한 것과 일관성 유지
      return;
    }

    // 브라우저 지원 여부 먼저 확인
    if (!('serviceWorker' in navigator)) {
      // 브라우저가 Service Worker API를 지원하지 않는 경우
      console.log('[PushNotificationService] 이 브라우저는 Service Worker를 지원하지 않습니다.');
      return;
    }
    
    if (!('PushManager' in window)) {
      // 브라우저가 Push API를 지원하지 않는 경우
      console.log('[PushNotificationService] 이 브라우저는 푸시 알림 API를 지원하지 않습니다.');
      return;
    }

    // 로그인 상태 확인 (리다이렉트 없이 단순 체크만)
    if (!isLoggedIn || !user?.id) {
      // 로그인하지 않은 경우 푸시 알림 설정을 하지 않음
      // 미들웨어에서 인증이 필요하지 않은 기능이므로 조용히 종료
      console.log('[PushNotificationService] 로그인이 필요합니다. (리다이렉트 없음)');
      return;
    }

    // 서비스 워커 및 푸시 구독 등록 함수
    const registerPushNotifications = async () => {
      try {
        console.log('[PushNotificationService] 푸시 알림 설정 시작 (로그인 상태: 정상, 브라우저 지원: 정상)');
        
        // 1. 서버에서 VAPID 공개 키 가져오기
        const { vapidPublicKey, ok } = await getVapidKey();
        // 푸시 알림 서버 인증을 위한 VAPID 키를 서버에서 받아옴
        
        if (!ok || !vapidPublicKey) {
          console.error('VAPID 공개 키를 가져오는데 실패했습니다.');
          return;
        }

        // 2. 서비스 워커 등록 (통합된 함수 사용)
        const registration = await registerServiceWorker();
        // 서비스 워커가 푸시 알림을 처리하기 위해 필요

        // 3. 알림 권한 요청 - UI 피드백 개선
        if (Notification.permission === 'default') {
          // 사용자가 아직 알림 권한에 대해 응답하지 않은 상태
          alert(
            "원활한 서비스 이용을 위해 알림 권한을 허용해주세요.\n" +
            "브라우저의 권한 요청 창이 표시됩니다."
          );
          // 사용자에게 권한 요청에 대한 사전 안내
          
          const permission = await Notification.requestPermission();
          // 브라우저의 알림 권한 요청 대화상자 표시
          console.log('알림 권한 응답:', permission);
          
          if (permission !== 'granted') {
            // 사용자가 권한을 거부한 경우
            alert(
              "알림 권한이 거부되었습니다.\n" +
              "약속 알림을 받기 위해서는 브라우저 설정에서 알림 권한을 허용해주세요."
            );
            return;
          } else {
            console.log('알림 권한이 허용되었습니다.');
          }
        } else if (Notification.permission === 'denied') {
          // 이미 권한이 거부된 상태인 경우
          alert(
            "브라우저에서 이미 알림 권한이 거부되어 있습니다.\n" +
            "설정 > 사이트 권한 > 알림에서 권한을 허용해주세요."
          );
          console.log('알림 권한이 이미 denied 상태입니다.');
          return;
        } else if (Notification.permission === 'granted') {
          // 이미 권한이 허용된 상태인 경우
          console.log('알림 권한이 이미 허용되어 있습니다.');
        }

        // 4. 기존 구독 확인
        let pushSubscription = await registration.pushManager.getSubscription();
        // 현재 브라우저에 이미 푸시 구독이 되어 있는지 확인
        
        // 5. 구독이 없으면 새로 생성
        if (!pushSubscription) {
          // 아직 푸시 구독이 없는 경우 새로 생성
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // 사용자에게 보이는 알림만 허용 (백그라운드 알림 금지)
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            // 서버에서 받은 VAPID 공개 키를 사용하여 구독 생성
          });
          
          console.log('새 푸시 구독이 생성되었습니다:', pushSubscription);
        }
        
        setSubscription(pushSubscription);
        // React 상태에 구독 정보 저장

        // 6. 서버에 구독 정보 저장
        await subscribePush({
          endpoint: pushSubscription.endpoint,
          // 푸시 메시지를 받을 엔드포인트 URL
          p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
          // 암호화 키 (Base64 인코딩)
          auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!))),
          // 인증 키 (Base64 인코딩)
          browserId: navigator.userAgent // 디바이스 식별용
          // 브라우저/디바이스 식별을 위한 User-Agent 문자열
        });
        
        console.log('푸시 구독 정보가 서버에 저장되었습니다.');
      } catch (error) {
        console.error('푸시 알림 설정 중 오류 발생:', error);
        // 에러 발생 시 사용자에게 알리지 않고 콘솔에만 로그 (백그라운드 서비스이므로)
      }
    };

    registerPushNotifications();
    // 비동기 함수 실행
  }, [isLoggedIn, user?.id, isEnterPage]); 
  // 의존성 배열: 로그인 상태, 사용자 ID, 페이지 상태가 변경될 때만 실행

  // UI를 렌더링하지 않는 유틸리티 컴포넌트
  return null;
  // 이 컴포넌트는 백그라운드 서비스이므로 UI를 렌더링하지 않음
};

export default PushNotificationService;
