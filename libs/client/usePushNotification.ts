import { useState, useEffect, useCallback } from "react";

interface PushNotificationHookResult {
  isPushSupported: boolean;
  hasPermission: boolean;
  subscription: PushSubscription | null;
  isSubscribing: boolean;
  error: string | null;
  subscribeToNotifications: () => Promise<boolean>;
  unsubscribeFromNotifications: () => Promise<boolean>;
}

export default function usePushNotification(): PushNotificationHookResult {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 푸시 알림 지원 여부 확인
  useEffect(() => {
    const checkPushSupport = async () => {
      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

      setIsPushSupported(supported);

      if (supported) {
        // 권한 확인
        const permission = Notification.permission;
        setHasPermission(permission === "granted");

        try {
          // 이미 등록된 서비스 워커 가져오기
          const registration = await navigator.serviceWorker.ready;

          if (registration) {
            // 기존 구독 정보 확인
            const existingSubscription = await registration.pushManager.getSubscription();
            setSubscription(existingSubscription);
          }
        } catch (err) {
          console.error("서비스 워커 등록 오류:", err);
          setError("서비스 워커를 등록할 수 없습니다");
        }
      }
    };

    checkPushSupport();
  }, []);

  // 푸시 알림 구독 함수
  const subscribeToNotifications = useCallback(async () => {
    if (!isPushSupported) {
      setError("이 브라우저는 푸시 알림을 지원하지 않습니다");
      return false;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      // 권한 요청
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("알림 권한이 거부되었습니다");
        }
        setHasPermission(true);
      }

      // VAPID 공개 키 가져오기 - 에러 처리 개선
      const keyResponse = await fetch("/api/push/subscribe");
      if (!keyResponse.ok) {
        const errorData = await keyResponse.json();
        throw new Error(errorData.error || "서버 설정 오류");
      }
      
      const { publicKey, ok } = await keyResponse.json();
      if (!ok || !publicKey) {
        throw new Error("VAPID 키를 가져오는데 실패했습니다");
      }

      // 이미 등록된 서비스 워커 확인
      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        throw new Error("Push Manager를 사용할 수 없습니다");
      }

      // VAPID 공개 키를 Uint8Array로 변환
      const convertedKey = urlBase64ToUint8Array(publicKey);

      // 새 구독 생성
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // 서버에 구독 정보 저장
      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription: newSubscription }),
      });

      if (!saveResponse.ok) {
        throw new Error("구독 정보를 서버에 저장하지 못했습니다");
      }

      setSubscription(newSubscription);
      return true;
    } catch (err) {
      console.error("푸시 알림 구독 오류:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isPushSupported, setHasPermission]);

  // 구독 취소 함수
  const unsubscribeFromNotifications = useCallback(async () => {
    if (!subscription) {
      return true; // 이미 구독 상태가 아님
    }

    try {
      const success = await subscription.unsubscribe();
      if (success) {
        setSubscription(null);
      }
      return success;
    } catch (err) {
      console.error("푸시 알림 구독 취소 오류:", err);
      setError(err instanceof Error ? err.message : "구독 취소 중 오류가 발생했습니다");
      return false;
    }
  }, [subscription]);

  return {
    isPushSupported,
    hasPermission,
    subscription,
    isSubscribing,
    error,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
}

// Base64 문자열을 Uint8Array로 변환하는 유틸 함수
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
