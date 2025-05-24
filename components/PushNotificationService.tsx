import { useEffect, useState } from 'react';
import useUser from '@libs/client/useUser';
import axios from 'axios';

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
        const { data: { vapidPublicKey, ok } } = await axios.get('/api/push/vapid-key');
        
        if (!ok || !vapidPublicKey) {
          console.error('VAPID 공개 키를 가져오는데 실패했습니다.');
          return;
        }

        // 2. 서비스 워커 등록
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('서비스 워커가 등록되었습니다:', registration);

        // 3. 알림 권한 요청 (필요한 경우)
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('알림 권한이 거부되었습니다.');
            return;
          }
        }

        // 4. 기존 구독 확인
        let pushSubscription = await registration.pushManager.getSubscription();
        
        // 5. 구독이 없으면 새로 생성
        if (!pushSubscription) {
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true, // 모든 메시지는 사용자에게 표시되어야 함
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
          
          console.log('새 푸시 구독이 생성되었습니다:', pushSubscription);
        }
        
        setSubscription(pushSubscription);

        // 6. 서버에 구독 정보 저장
        await axios.post('/api/push/subscribe', {
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
