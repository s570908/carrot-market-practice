import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PushSubscriptionManager() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'expired' | 'denied'>('checking');

  useEffect(() => {
    checkAndManageSubscription();
  }, []);

  const checkAndManageSubscription = async () => {
    try {
      // 브라우저 지원 확인
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setSubscriptionStatus('denied');
        return;
      }

      // 권한 확인
      if (Notification.permission === 'denied') {
        setSubscriptionStatus('denied');
        return;
      }

      // 서비스 워커 등록 확인
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // 구독이 없으면 새로 생성
        await createNewSubscription(registration);
        return;
      }

      // 기존 구독 테스트
      const isValid = await testSubscription(subscription);
      if (!isValid) {
        // 만료된 구독이면 새로 생성
        await subscription.unsubscribe();
        await createNewSubscription(registration);
      } else {
        setSubscriptionStatus('active');
      }
    } catch (error) {
      console.error('구독 관리 중 오류:', error);
      setSubscriptionStatus('expired');
    }
  };

  const createNewSubscription = async (registration: ServiceWorkerRegistration) => {
    try {
      // 권한 요청 (필요시)
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'denied') {
          setSubscriptionStatus('denied');
          return;
        }
      }

      // 새 구독 생성
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // 서버에 새 구독 정보 전송
      await axios.post('/api/push-subscribe', {
        subscription: subscription.toJSON(),
        action: 'subscribe'
      });

      setSubscriptionStatus('active');
    } catch (error) {
      console.error('새 구독 생성 실패:', error);
      setSubscriptionStatus('expired');
    }
  };

  const testSubscription = async (subscription: PushSubscription) => {
    try {
      // 서버에 테스트 요청 전송
      const response = await axios.post('/api/push-test', {
        subscription: subscription.toJSON()
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };

  const handleRenewSubscription = () => {
    checkAndManageSubscription();
  };

  if (subscriptionStatus === 'checking') return null;

  if (subscriptionStatus === 'expired') {
    return (
      <div className="fixed z-50 max-w-sm p-4 border border-yellow-200 rounded-lg shadow-lg bottom-4 right-4 bg-yellow-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-600">⚠️</span>
          <span className="font-medium text-yellow-800">알림 구독 만료</span>
        </div>
        <p className="mb-3 text-sm text-yellow-700">
          약속 알림을 받으려면 알림 구독을 갱신해주세요.
        </p>
        <button
          onClick={handleRenewSubscription}
          className="w-full px-3 py-2 text-sm text-white bg-yellow-600 rounded hover:bg-yellow-700"
        >
          알림 구독 갱신
        </button>
      </div>
    );
  }

  return null;
}
