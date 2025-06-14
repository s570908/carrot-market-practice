import { useEffect, useState } from 'react';
import useUser from '@libs/client/useUser';
import axios from 'axios';
import { getVapidKey, subscribePush } from '@/apiLibs/push';

// 서비스 워커 등록 및 푸시 구독 관리 컴포넌트
const PushNotificationService = () => {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Base64 문자열을 Uint8Array로 변환하는 유틸리티 함수
  const urlBase64ToUint8Array = (base64String: string) => {
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
  };

  // 서비스 워커 등록 및 활성화 함수 (기존 _app.tsx 코드와 통합)
  const registerServiceWorker = async () => {
    try {
      // 이미 등록된 서비스 워커가 있는지 확인
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        // 등록된 서비스 워커가 없을 경우 새로 등록
        const registration = await navigator.serviceWorker.register('/service-worker.js', { 
          scope: "/",
          // 서비스 워커에 푸시 기능도 포함되어 있음을 명시적으로 주석으로 표시
          // 이 서비스 워커는 캐싱, 오프라인 지원, 푸시 알림 등 모든 기능 담당
        });
        
        console.log("서비스 워커 등록 성공:", registration.scope);
        
        // 등록 후 새로고침하여 서비스 워커가 활성화되도록 함
        if (registration.installing) {
          registration.installing.addEventListener("statechange", (e) => {
            if ((e.target as any).state === "activated") {
              console.log("서비스 워커 활성화됨");
            }
          });
        }
        
        return registration;
      } else {
        console.log("이미 등록된 서비스 워커가 있습니다:", registrations);
        return registrations[0]; // 첫 번째 등록된 서비스 워커 반환
      }
    } catch (error) {
      console.error("서비스 워커 등록 실패:", error);
      throw error;
    }
  };

  // 사용자의 구독 등록/확인 로직
  useEffect(() => {
    // 로그인 상태가 아니거나 서비스 워커/푸시 API가 지원되지 않으면 실행하지 않음
    if (!user?.id || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('푸시 알림을 지원하지 않는 브라우저이거나 로그인이 필요합니다.');
      return;
    }

    // 서비스 워커 및 푸시 구독 등록 함수
    const registerPushNotifications = async () => {
      try {
        // 1. 서버에서 VAPID 공개 키 가져오기
        const { vapidPublicKey, ok } = await getVapidKey();
        
        if (!ok || !vapidPublicKey) {
          console.error('VAPID 공개 키를 가져오는데 실패했습니다.');
          return;
        }

        // 2. 서비스 워커 등록 (통합된 함수 사용)
        const registration = await registerServiceWorker();

        // 3. 알림 권한 요청 - UI 피드백 개선
        if (Notification.permission === 'default') {
          // 아직 사용자가 응답하지 않은 상태일 때만 권한 요청
          alert(
            "원활한 서비스 이용을 위해 알림 권한을 허용해주세요.\n" +
            "브라우저의 권한 요청 창이 표시됩니다."
          );
          const permission = await Notification.requestPermission();
          console.log('알림 권한 응답:', permission);
          if (permission !== 'granted') {
            alert(
              "알림 권한이 거부되었습니다.\n" +
              "약속 알림을 받기 위해서는 브라우저 설정에서 알림 권한을 허용해주세요."
            );
            return;
          } else {
            console.log('알림 권한이 허용되었습니다.');
          }
        } else if (Notification.permission === 'denied') {
          // 이미 거부된 경우 안내만 표시
          alert(
            "브라우저에서 이미 알림 권한이 거부되어 있습니다.\n" +
            "설정 > 사이트 권한 > 알림에서 권한을 허용해주세요."
          );
          console.log('알림 권한이 이미 denied 상태입니다.');
          return;
        } else if (Notification.permission === 'granted') {
          // 이미 허용된 경우
          console.log('알림 권한이 이미 허용되어 있습니다.');
        }

        // 4. 기존 구독 확인
        let pushSubscription = await registration.pushManager.getSubscription();
        
        // 5. 구독이 없으면 새로 생성
        if (!pushSubscription) {
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
          
          console.log('새 푸시 구독이 생성되었습니다:', pushSubscription);
        }
        
        setSubscription(pushSubscription);

        // 6. 서버에 구독 정보 저장
        await subscribePush({
          endpoint: pushSubscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!))),
          browserId: navigator.userAgent // 디바이스 식별용
        });
        
        console.log('푸시 구독 정보가 서버에 저장되었습니다.');
      } catch (error) {
        console.error('푸시 알림 설정 중 오류 발생:', error);
      }
    };

    registerPushNotifications();
  }, [user?.id]); // 사용자 로그인 상태가 변경될 때만 실행

  // UI를 렌더링하지 않는 유틸리티 컴포넌트
  return null;
};

export default PushNotificationService;
