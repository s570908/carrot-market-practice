import { useEffect } from "react";
import { initializePushSubscription } from "@libs/client/pushUtils";

// React Hook for managing push subscription lifecycle
export function usePushSubscription() {
  useEffect(() => {
    // 페이지 로드 시 푸시 구독 상태 확인 및 갱신
    const initPush = async () => {
      try {
        await initializePushSubscription();
      } catch (error) {
        console.error("푸시 구독 초기화 실패:", error);
      }
    };

    // DOM이 완전히 로드된 후 실행
    if (typeof window !== "undefined" && navigator.serviceWorker) {
      initPush();
    }
  }, []);

  // 페이지 포커스 시에도 구독 상태 확인 (사용자가 탭으로 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      initializePushSubscription().catch(console.error);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}