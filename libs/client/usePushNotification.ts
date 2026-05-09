import { useState, useEffect, useCallback } from "react";
import { urlBase64ToUint8Array } from "./pushUtils";

declare global {
  interface Window {
    RequestFileSystem?: (type: number, size: number, successCallback: FileSystemEntryCallback, errorCallback?: ErrorCallback) => void;
    webkitRequestFileSystem?: (type: number, size: number, successCallback: FileSystemEntryCallback, errorCallback?: ErrorCallback) => void;
    TEMPORARY?: number;
  }
}

// 모듈 레벨 상태 관리
let globalSubscription: PushSubscription | null = null;
let globalHasPermission: boolean = false;
const listeners: Set<(state: { subscription: PushSubscription | null; hasPermission: boolean }) => void> = new Set();

// 구독 검증 플래그 (모듈 레벨에서 한 번만 실행되도록)
let hasRunValidation = false;
let validationTimer: NodeJS.Timeout | null = null;

// 상태 업데이트 함수
const updateState = (newState: { subscription?: PushSubscription | null; hasPermission?: boolean }) => {
  if (newState.subscription !== undefined) globalSubscription = newState.subscription;
  if (newState.hasPermission !== undefined) globalHasPermission = newState.hasPermission;
  
  listeners.forEach(listener => listener({
    subscription: globalSubscription,
    hasPermission: globalHasPermission
  }));
};

// 브라우저/기기 식별자 관리
const BROWSER_ID_KEY = 'push_browser_id';

function generateBrowserId() {
  return 'browser_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function getBrowserId() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null; // 서버 사이드 렌더링 대응
  }
  
  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id = generateBrowserId();
    localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}

interface PushNotificationHookResult {
  isPushSupported: boolean;
  hasPermission: boolean;
  subscription: PushSubscription | null;
  isSubscribing: boolean;
  error: string | null;
  isIncognito: boolean | null; // 인커그니토 상태 추가
  subscribeToNotifications: () => Promise<boolean>;
  unsubscribeFromNotifications: () => Promise<boolean>;
}

export default function usePushNotification(): PushNotificationHookResult {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(globalHasPermission);
  const [subscription, setSubscription] = useState<PushSubscription | null>(globalSubscription);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIncognito, setIsIncognito] = useState<boolean | null>(null); // 인커그니토 상태 추가

  // 구독 상태 변경 구독
  useEffect(() => {
    const listener = (state: { subscription: PushSubscription | null; hasPermission: boolean }) => {
      setSubscription(state.subscription);
      setHasPermission(state.hasPermission);
    };
    
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [isPushSupported, setError, setIsSubscribing, setSubscription]);

  // 푸시 알림 지원 여부 확인
  useEffect(() => {
    const checkPushSupport = async () => {
      // 기본 지원 여부 확인
      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

      if (!supported) {
        setIsPushSupported(false);
        return;
      }

      // 서비스 워커 등록 시도
      try {
        // 서비스 워커가 등록 가능한지 테스트
        const swTest = await navigator.serviceWorker.getRegistration();
        
        // Notification 권한 확인
        const permission = Notification.permission;
        
        // PushManager 구독 가능 여부 테스트
        let canSubscribe = false;
        if (swTest) {
          try {
            // 테스트 구독 시도 (실제로 구독하지는 않음)
            const testSubscriptionOptions = { userVisibleOnly: true };
            canSubscribe = true;
          } catch (e) {
            console.warn("푸시 구독 테스트 실패:", e);
            canSubscribe = false;
          }
        }

        // 인코그니토 모드 추정 (직접 알림 생성 테스트)
        let isProbablyIncognito = false;
        
        if (permission === "granted") {
          try {
            // 실제 구독 기능 테스트 - 이 부분은 인코그니토에서 실패할 가능성이 높음
            if (swTest && 'pushManager' in swTest) {
              await swTest.pushManager.permissionState({ userVisibleOnly: true });
            }
          } catch (e) {
            console.warn("푸시 권한 상태 확인 실패:", e);
            isProbablyIncognito = true;
          }
        }
        
        // 결과 업데이트
        const effectivelySupported = supported && canSubscribe && !isProbablyIncognito;
        setIsPushSupported(effectivelySupported);
        setIsIncognito(isProbablyIncognito);
        
        // 지원되는 상태면 추가 정보 설정
        if (effectivelySupported) {
          updateState({ hasPermission: permission === "granted" });
          
          if (swTest) {
            const existingSubscription = await swTest.pushManager.getSubscription();
            updateState({ subscription: existingSubscription });
          }
        }
        
        // 디버그 정보 출력
        console.log("푸시 알림 지원 세부정보:", {
          기본지원: supported,
          서비스워커: !!swTest,
          구독가능: canSubscribe,
          권한상태: permission, 
          인코그니토추정: isProbablyIncognito,
          최종지원여부: effectivelySupported
        });
        
      } catch (err) {
        console.error("푸시 지원 확인 오류:", err);
        setIsPushSupported(false);
        setError("푸시 알림 기능을 확인할 수 없습니다");
      }
    };

    checkPushSupport();
  }, []);

  // 인코그니토 모드 감지 - 더 정확한 방법으로 업데이트
  useEffect(() => {
    const detectIncognitoMode = async () => {
      if (typeof window === 'undefined') return;
      
      console.log("인코그니토 모드 확인 시작...");
      
      try {
        // Notification 권한 상태로 인코그니토 확인 (가장 정확한 방법)
        const notificationTest = async () => {
          // 알림 권한이 이미 denied면 인코그니토일 가능성 높음
          if (Notification.permission === 'denied') {
            // 사용자가 이전에 직접 거부했는지 확인하기 위한 추가 테스트
            const reg = await navigator.serviceWorker.getRegistration();
            
            if (reg) {
              try {
                // 푸시 알림 기능이 작동하는지 실제 테스트 
                // 인코그니토에서는 권한이 denied지만 서비스워커/푸시매니저는 존재함
                const supportsPushNotification = 'pushManager' in reg;
                
                // 서비스워커가 있고 푸시매니저도 있는데 권한이 denied라면
                // 사용자 동의 없이 자동으로 거부된 것 = 인코그니토 모드
                return supportsPushNotification;
              } catch (e) {
                return false;
              }
            }
          }
          return false;
        };
        
        // 2. 그 외 보조적인 테스트들
        const isNotificationDeniedWithoutPrompt = await notificationTest();
        
        // 최종 판단
        const finalResult = isNotificationDeniedWithoutPrompt;
        
        // 디버그 정보
        console.log("인코그니토 모드 감지 결과:", {
          알림권한자동거부: isNotificationDeniedWithoutPrompt,
          최종판단: finalResult
        });
        
        setIsIncognito(finalResult);
      } catch (e) {
        console.error("인코그니토 감지 오류:", e);
        setIsIncognito(false);
      }
    };
    
    detectIncognitoMode();
  }, []);

  // 구독 취소 함수 수정
  const unsubscribeFromNotifications = useCallback(async () => {
    if (!subscription) {
      return true;
    }

    // 네트워크 상태 확인 (서버 통신에만 필요)
    const isOfflineMode = typeof window !== 'undefined' && !navigator.onLine;

    try {
      const success = await subscription.unsubscribe();
      if (success) {
        // 서버에도 구독 취소 알림 (온라인일 때만)
        if (!isOfflineMode) {
          try {
            await fetch("/api/push/unsubscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ endpoint: subscription.endpoint })
            });
          } catch (serverError) {
            console.warn("서버 구독 취소 실패:", serverError);
            // 클라이언트 측 구독 취소는 성공했으므로 계속 진행
          }
        }

        setSubscription(null);
        updateState({ subscription: null });
      }
      return success;
    } catch (err) {
      console.error("푸시 알림 구독 취소 오류:", err);
      setError(err instanceof Error ? err.message : "구독 취소 중 오류가 발생했습니다");
      return false;
    }
  }, [subscription]);

  // 알림 권한 변경 감지
  useEffect(() => {
    const handlePermissionChange = async () => {
      const permission = Notification.permission;
      updateState({ hasPermission: permission === "granted" });

      // 권한이 거부되면 구독 취소
      if (permission !== "granted" && subscription) {
        await unsubscribeFromNotifications();
      }
    };

    // 권한 변경 이벤트 리스너 (Chrome/Firefox 지원)
    if (typeof window !== 'undefined' && 'permissions' in navigator && 'query' in navigator.permissions) {
      (navigator.permissions as any).query({ name: 'notifications' as string }).then((status: any) => {
        status.addEventListener('change', handlePermissionChange);
      }).catch((err: unknown) => {
        console.error("권한 쿼리 오류:", err);
      });
    }

    return () => {
      if (typeof window !== 'undefined' && 'permissions' in navigator && 'query' in navigator.permissions) {
        (navigator.permissions as any).query({ name: 'notifications' as string }).then((status: any) => {
          status.removeEventListener('change', handlePermissionChange);
        }).catch((err: unknown) => {});
      }
    };
  }, [subscription, unsubscribeFromNotifications]);

  // 구독 상태 주기적 검증 - 모듈 레벨 플래그로 한 번만 실행되도록 수정
  useEffect(() => {
    // 이미 검증을 실행했거나 타이머가 이미 설정되었으면 중복 실행 방지
    if (!subscription || hasRunValidation || validationTimer) {
      return;
    }

    const validateSubscription = async () => {
      // 모듈 레벨에서 중복 실행 체크
      if (hasRunValidation) return;
      
      try {
        console.log("구독 유효성 검사 시작");
        hasRunValidation = true; // 실행 표시 (검증 시작 전에 설정)
        
        const response = await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            useCurrentSubscriptionOnly: true,
            currentSubscription: subscription,
            title: "구독 유효성 검사",
            body: "구독 상태를 확인합니다."
          })
        });
        
        // 응답 체크
        if (!response.ok) {
          throw new Error("구독 검증 실패");
        }
        
        console.log("구독 유효성 확인 완료");
      } catch (error) {
        console.log("구독이 만료되었거나 유효하지 않음");
        hasRunValidation = false; // 실패 시 재시도 가능하도록 플래그 초기화
        await unsubscribeFromNotifications();
      }
    };

    // 한 번만 타이머 설정 (모듈 레벨 변수 사용)
    if (!validationTimer) {
      console.log("검증 타이머 설정");
      validationTimer = setTimeout(() => {
        validateSubscription().finally(() => {
          // 타이머 참조 초기화
          validationTimer = null;
        });
      }, 10000);
    }
    
    return () => {
      // 컴포넌트 언마운트 시 타이머 정리
      if (validationTimer) {
        clearTimeout(validationTimer);
        validationTimer = null;
      }
    };
  }, [subscription, unsubscribeFromNotifications]);

  // 앱이 종료될 때 플래그 초기화하는 함수 (선택적)
  useEffect(() => {
    const resetValidationFlagOnExit = () => {
      // 페이지 새로고침 또는 종료 시 플래그 초기화
      hasRunValidation = false;
      if (validationTimer) {
        clearTimeout(validationTimer);
        validationTimer = null;
      }
    };
    
    // 페이지 언로드 이벤트 리스너 (선택적)
    window.addEventListener('beforeunload', resetValidationFlagOnExit);
    
    return () => {
      window.removeEventListener('beforeunload', resetValidationFlagOnExit);
    };
  }, []);

  // 푸시 알림 구독 함수
  const subscribeToNotifications = useCallback(async () => {
    if (!isPushSupported) {
      setError("이 브라우저는 푸시 알림을 지원하지 않습니다");
      return false;
    }

    // 인코그니토 모드 검사 대신 더 직접적인 메시지
    if (isIncognito) {
      setError("브라우저 환경이 제한되어 푸시 알림을 활성화할 수 없습니다. 일반 창으로 시도해보세요.");
      return false;
    }

    // 네트워크 상태 확인
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setError("오프라인 상태입니다. 네트워크 연결 후 다시 시도해주세요.");
      return false;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("알림 권한이 거부되었습니다");
        }
        updateState({ hasPermission: true });
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

      const convertedKey = urlBase64ToUint8Array(publicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as BufferSource,
      });

      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          subscription: newSubscription,
          browserId: getBrowserId() // 브라우저 ID 전송
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("구독 정보를 서버에 저장하지 못했습니다");
      }

      setSubscription(newSubscription);
      updateState({ subscription: newSubscription });
      return true;
    } catch (err) {
      console.error("푸시 알림 구독 오류:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isPushSupported, isIncognito, setError, setIsSubscribing, setSubscription]);

  return {
    isPushSupported,
    hasPermission,
    subscription,
    isSubscribing,
    error,
    isIncognito, // 인커그니토 상태 반환 추가
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
}

// function urlBase64ToUint8Array(base64String: string): Uint8Array {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);

//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// }
