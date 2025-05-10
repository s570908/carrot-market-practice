/**
 * PWA 테스터 페이지 알고리즘
 * 
 * 1. 상태 관리:
 *    - isOnline: 현재 네트워크 연결 상태
 *    - installPrompt: PWA 설치 프롬프트 이벤트 저장
 *    - serviceWorkerStatus: 서비스 워커 상태 정보
 *    - cacheKeys: 캐시 스토리지에 저장된 캐시 키 목록
 * 
 * 2. 네트워크 상태 모니터링 (useEffect):
 *    - navigator.onLine으로 초기 상태 설정
 *    - online/offline 이벤트 리스너 등록
 *    - 상태 변경 시 UI 업데이트
 * 
 * 3. PWA 설치 프롬프트 처리 (useEffect):
 *    - beforeinstallprompt 이벤트 캡처
 *    - 설치 가능 상태 저장
 *    - 사용자 요청 시 설치 프롬프트 표시
 * 
 * 4. 서비스 워커 상태 확인 (useEffect):
 *    - 서비스 워커 지원 여부 확인
 *    - 등록된 서비스 워커 검색
 *    - 상태 정보 업데이트 및 표시
 * 
 * 5. 캐시 상태 확인 (useEffect):
 *    - 캐시 스토리지 접근 가능 여부 확인
 *    - 저장된 캐시 키 목록 조회
 *    - UI에 캐시 정보 표시
 * 
 * 6. 테스트 기능:
 *    a) 알림 테스트 (sendTestNotification):
 *       - 알림 권한 확인 및 요청
 *       - 테스트 알림 발송
 * 
 *    b) 서비스 워커 통신 테스트 (testServiceWorkerMessage):
 *       - 서비스 워커 활성화 확인
 *       - 테스트 메시지 전송
 *       - 응답 수신 및 표시
 * 
 *    c) 오프라인 모드 테스트 (simulateOffline):
 *       - 개발자 도구 사용 안내
 * 
 *    d) PWA 설치 테스트 (showInstallPrompt):
 *       - 설치 프롬프트 표시
 *       - 사용자 선택 결과 처리
 * 
 * 7. UI 렌더링:
 *    - PWA 상태 정보 표시 (네트워크, 서비스 워커, 캐시)
 *    - 푸시 알림 설정 컴포넌트
 *    - 테스트 기능 버튼들
 */

import React, { useEffect, useState } from "react";
import Layout from "@components/Layout";
import PushNotificationToggle from "@components/PushNotificationToggle";
import Button from "@components/Button";
import usePushNotification from "@libs/client/usePushNotification";
import useUser from "@libs/client/useUser"; // 현재 사용자 정보를 가져오기 위한 훅

export default function PwaTester() {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState("checking...");
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(null);
  const [isEndpointDeprecated, setIsEndpointDeprecated] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  
  // 환경 변수에서 직접 VAPID 공개키 가져오기
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
  
  // 푸시 알림 및 사용자 정보
  const { subscription, isPushSupported, hasPermission, subscribeToNotifications, unsubscribeFromNotifications } = usePushNotification();
  const { user } = useUser();

  useEffect(() => {
  // 브라우저의 현재 네트워크 연결 상태를 확인하고 상태를 업데이트합니다.
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {

    const handler = (e: BeforeInstallPromptEvent) => {
      //  기본적으로 브라우저가 자동으로 표시하는 설치 프롬프트를 막음
      // 이를 통해 개발자가 사용자 경험을 완전히 제어 가능하게 함
      e.preventDefault();
      // 설치 프롬프트 이벤트를 저장하여 나중에 사용할 수 있도록 함
      // 사용자가 명시적으로 "앱 설치" 버튼을 클릭할 때까지 대기
      setInstallPrompt(e);
      
      console.log('beforeinstallprompt 이벤트 핸들러--설치 프롬프트 준비됨:', {
        platform: navigator.platform,
        vendor: navigator.vendor,
        userAgent: navigator.userAgent
      });
    };
    // 브라우저가 PWA 설치 조건이 충족됐다고 판단하면 beforeinstallprompt 이벤트 발생
    // 설치 조건: 유효한 manifest.json, HTTPS, 서비스워커 등록, 방문 빈도/기간 충족
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const checkServiceWorker = async () => {
      // 브라우저가 서비스 워커 API를 지원하는지 확인합니다.
      // 서비스 워커는 모든 브라우저에서 지원되지 않으므로 이 검사가 필요합니다.
      if ('serviceWorker' in navigator) {
        try {
          // 현재 도메인에 등록된 모든 서비스 워커 목록을 비동기적으로 가져옵니다.
          // 다른 경로에 다른 서비스 워커가 등록되어 있을 수 있으므로, 모든 등록된 서비스 워커를 확인합니다.
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length > 0) {
            setServiceWorkerStatus(`Active: ${registrations.length} registered`);
          } else {
            setServiceWorkerStatus("No service worker registered");
          }
        } catch (error) {
          setServiceWorkerStatus(`Error: ${error}`);
        }
      } else {
        setServiceWorkerStatus("Service workers not supported");
      }
    };
    
    checkServiceWorker();
  }, []);

  useEffect(() => {
    const checkCaches = async () => {
      // 브라우저가 캐시 API를 지원하는지 확인합니다.
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          setCacheKeys(keys);
        } catch (error) {
          console.error("Cache check error:", error);
        }
      }
    };
    
    checkCaches();
  }, []);

  useEffect(() => {
    if (subscription?.endpoint) {
      setSubscriptionEndpoint(subscription.endpoint);
      
      const isOldFormat = subscription.endpoint.includes("/fcm/send/");
      setIsEndpointDeprecated(isOldFormat);
      
      if (isOldFormat) {
        console.warn("구형 엔드포인트 형식이 감지됨:", subscription.endpoint);
        console.warn("FCM이 /wp/ 형식의 새 엔드포인트로 전환 중입니다.");
      }
    } else {
      setSubscriptionEndpoint(null);
      setIsEndpointDeprecated(false);
    }
  }, [subscription]); // subscription이 변경될 때마다 엔드포인트 상태를 업데이트합니다.

  // 브라우저의 알림 권한 상태를 실시간으로 모니터링하고 변경 사항에 대응하는 중요한 기능을 구현
  useEffect(() => {
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      const setupPermissionObserver = async () => {
        try {
          const status = await navigator.permissions.query({ name: 'notifications' as PermissionName });
          setPermissionStatus(status);
          
          const handleStatusChange = () => {
            console.log('알림 권한 상태 변경:', status.state);
            setPermissionStatus(status);
            
            if (status.state === 'denied' && subscription) {
              unsubscribeFromNotifications();
              alert('브라우저 설정에서 알림 권한이 거부되어 구독이 취소되었습니다.');
            }
          };
          
          // 이벤트 리스너 등록
          status.addEventListener('change', handleStatusChange);
          
          // cleanup 함수에서 이벤트 리스너 제거 추가
          return () => {
            status.removeEventListener('change', handleStatusChange);
          };
        } catch (error) {
          console.error('권한 상태 확인 오류:', error);
        }
      };
      
      const cleanupFn = setupPermissionObserver();
      
      // useEffect의 cleanup 함수
      return () => {
        // setupPermissionObserver에서 반환된 cleanup 함수가 있으면 실행
        if (cleanupFn && typeof cleanupFn.then === 'function') {
          cleanupFn.then(cleanup => {
            if (cleanup && typeof cleanup === 'function') {
              cleanup();
            }
          });
        }
      };
    }
  }, [subscription, unsubscribeFromNotifications]);

  const sendTestNotification = async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }
    
    if (Notification.permission === "granted") {
      new Notification("브라우저 알림 테스트", {
        body: "로컬 알림 테스트입니다 (브라우저가 열려있을 때만 작동)",
        icon: "/icons/soy-bean-192-192.png",
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("브라우저 알림 테스트", {
          body: "로컬 알림 테스트입니다 (브라우저가 열려있을 때만 작동)",
          icon: "/icons/soy-bean-192-192.png",
        });
      }
    }
  };

  const testPushNotification = async () => {
    if (!subscription) {
      alert("푸시 알림이 비활성화되어 있습니다. 먼저 푸시 알림을 활성화하세요.");
      return;
    }

    if (!user?.id) {
      alert("사용자 정보를 불러올 수 없습니다. 로그인 상태를 확인하세요.");
      return;
    }

    if (!vapidPublicKey) {
      alert("VAPID 공개키가 설정되지 않았습니다. 환경 설정을 확인하세요.");
      return;
    }

    try {
      setIsPushLoading(true);
      
      const endpoint = subscription.endpoint;
      console.log("푸시 알림 테스트 - 현재 엔드포인트:", endpoint);
      console.log("엔드포인트 형식:", endpoint.includes("/fcm/send/") ? "구형식" : "신형식");
      
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: user.id,
          title: "푸시 알림 테스트",
          body: "원격 푸시 알림 테스트입니다. 브라우저가 닫혀있어도 작동합니다.",
          icon: "/icons/soy-bean-192-192.png",
          badge: "/icons/soy-bean-96-96.png",
          data: {
            url: "/pwa-tester",
            testInfo: "이것은 테스트 데이터입니다",
          },
          // 해석:
          // 👉 "현재 구독만 사용하겠다." 라는 의미입니다.          
          // 설명:
          // 만약 사용자가 여러 구독 플랜(예: 무료 체험, 프리미엄, 프로 등)을 가지고 있거나 과거 이력이 있을 때,
          // 이 옵션을 true로 설정하면 오직 "현재 활성화된 구독" 데이터만 가져오거나 사용할 수 있게 합니다.          
          // 이 옵션을 false로 설정하면 사용자가 과거에 구독했던 모든 구독 플랜을 가져오게 됩니다.          
          useCurrentSubscriptionOnly: true,
          // 해석:
          // 👉 "현재 활성화된 구독 데이터를 subscription이라는 객체로 넘긴다."          
          // 설명:
          // subscription이라는 변수에 사용자의 현재 구독 정보가 담겨 있고, 이걸 설정값으로 넘기는 것입니다.
          // 이걸 통해 시스템은 subscription 객체를 직접 보고 작동할 수 있습니다.
          currentSubscription: subscription
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "푸시 알림 전송 실패");
      }

      alert("푸시 알림이 발송되었습니다! 잠시 후 알림이 표시됩니다.");
    } catch (error) {
      console.error("푸시 알림 전송 오류:", error);
      alert(`푸시 알림 전송 중 오류가 발생했습니다: ${error}`);
    } finally {
      setIsPushLoading(false);
    }
  };

  const validateSubscription = async () => {
    if (!subscription) {
      alert('현재 활성화된 구독이 없습니다.');
      return;
    }
    
    // 네트워크 상태 확인 추가
    if (!navigator.onLine) {
      alert('오프라인 상태입니다. 네트워크 연결 후 다시 시도해주세요.');
      return;
    }
    
    try {
      setIsPushLoading(true);
      
      // 간단하게 테스트 메시지 전송으로 유효성 검사
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: user?.id,
          title: '구독 유효성 검사',
          body: '구독이 유효한지 확인하는 테스트입니다.',
          icon: '/icons/soy-bean-96-96.png',
          useCurrentSubscriptionOnly: true,
          currentSubscription: subscription
        }),
      });
      
      if (!response.ok) {
        throw new Error('서버 응답 오류: ' + response.status);
      }
      
      const data = await response.json();
      
      if (data.ok) {
        alert('구독이 유효합니다. 테스트 알림이 전송되었습니다.');
        setLastChecked(new Date().toLocaleString());
      } else {
        alert(`구독이 유효하지 않습니다: ${data.error || '알 수 없는 오류'}`);
        if (window.confirm('만료된 구독을 갱신하시겠습니까?')) {
          await unsubscribeFromNotifications();
          await subscribeToNotifications();
        }
      }
    } catch (error) {
      console.error('구독 유효성 검사 오류:', error);
      alert(`구독 유효성 검사 중 오류가 발생했습니다: ${error}`);
      
      // 오류가 발생해도 갱신 옵션 제공
      if (window.confirm('구독 확인에 실패했습니다. 구독을 갱신하시겠습니까?')) {
        try {
          // 네트워크 연결 확인
          if (!navigator.onLine) {
            alert('오프라인 상태에서는 구독을 갱신할 수 없습니다. 네트워크 연결 후 다시 시도해주세요.');
            return;
          }
          
          // 구독 갱신 시도
          await unsubscribeFromNotifications();
          const success = await subscribeToNotifications();
          
          if (success) {
            alert('구독이 성공적으로 갱신되었습니다.');
          } else {
            alert('구독 갱신에 실패했습니다.');
          }
        } catch (renewError) {
          console.error('구독 갱신 오류:', renewError);
          alert(`구독 갱신 중 오류가 발생했습니다: ${renewError}`);
        }
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  const testServiceWorkerMessage = () => {
    if (!navigator.serviceWorker.controller) {
      alert("서비스 워커가 활성화되지 않았습니다");
      return;
    }
    
    navigator.serviceWorker.controller.postMessage({
      type: "TEST_MESSAGE",
      data: "Hello from PWA Tester",
    });
    
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SERVICE_WORKER_RESPONSE") {
        alert(`서비스 워커 응답: ${event.data.data}`);
      }
    });
  };

  const simulateOffline = () => {
    if ("serviceWorker" in navigator) {
      alert("개발자 도구의 Network 탭에서 'Offline'을 체크하여 오프라인 모드를 테스트하세요");
    }
  };

  const showInstallPrompt = async () => {
    if (!installPrompt) {
      alert("설치 프롬프트를 표시할 수 없습니다.");
      return;
    }
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    switch (outcome) {
      case 'accepted':
        console.log('사용자가 PWA 설치를 수락했습니다');
        break;
      case 'dismissed':
        console.log('사용자가 PWA 설치를 거부했습니다');
        break;
    }
    
    setInstallPrompt(null);
  };

  const showEndpointInfo = () => {
    if (!subscription) {
      alert("푸시 알림이 활성화되어 있지 않습니다.");
      return;
    }
    
    const endpoint = subscription.endpoint;
    
    alert(`
현재 구독 엔드포인트:
${endpoint}

엔드포인트 분석:
- 형식: ${endpoint.includes("/fcm/send/") ? "구형식 (/fcm/send/)" : endpoint.includes("/wp/") ? "신형식 (/wp/)" : "알 수 없는 형식"}
- 상태: ${isEndpointDeprecated ? "구형 형식 (오류 발생 가능)" : "정상"}

주의사항:
Google FCM이 엔드포인트 형식을 /fcm/send/에서 /wp/로 변경하고 있습니다.
구형 엔드포인트는 간헐적으로 오류가 발생할 수 있습니다.

해결 방법:
1. 구독 취소 후 다시 구독하세요.
2. 브라우저를 완전히 닫고 다시 열어보세요.
    `);
  };

  const renewSubscription = async () => {
    if (!isEndpointDeprecated) {
      alert("현재 구독은 최신 형식이므로 갱신이 필요하지 않습니다.");
      return;
    }
    
    try {
      if (subscription) {
        await unsubscribeFromNotifications();
      }
      
      alert("구형 푸시 구독을 취소했습니다. 새 구독을 등록합니다...");
      const success = await subscribeToNotifications();
      
      if (success) {
        alert("구독이 성공적으로 갱신되었습니다!");
      } else {
        alert("구독 갱신 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("구독 갱신 오류:", error);
      alert(`구독 갱신 중 오류가 발생했습니다: ${error}`);
    }
  };

  const openNotificationSettings = () => {
    if ('permissions' in navigator) {
      alert('브라우저 설정에서 알림 권한을 확인/변경할 수 있습니다.\n\n' +
            '• Chrome: 설정 > 개인정보 및 보안 > 사이트 설정 > 알림\n' +
            '• Firefox: 설정 > 개인 정보 및 보안 > 권한 > 알림\n' +
            '• Safari: 설정 > 웹사이트 > 알림');
    }
  };

  return (
    <Layout title="PWA 테스터" seoTitle="PWA 기능 테스트 페이지">
      <div className="px-4 py-6 space-y-6">
        <div className="p-4 bg-white border border-gray-200 rounded-md">
          <h2 className="mb-4 text-lg font-medium text-gray-900">PWA 상태</h2>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 mr-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isOnline ? '온라인' : '오프라인'}</span>
            </div>
            <p className="text-xs text-gray-500">
              {isOnline 
                ? '인터넷에 연결되어 있습니다' 
                : '오프라인 상태입니다. 캐시된 콘텐츠만 표시됩니다'}
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium">서비스 워커 상태</h3>
            <p className="text-xs text-gray-500">{serviceWorkerStatus}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium">캐시 상태</h3>
            {cacheKeys.length > 0 ? (
              <ul className="ml-2 text-xs text-gray-500">
                {cacheKeys.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">캐시가 없습니다</p>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-medium">VAPID 공개키 상태</h3>
            <p className="text-xs text-gray-500">
              {vapidPublicKey 
                ? '환경 변수에서 설정됨' 
                : 'VAPID 공개키가 설정되지 않았습니다'}
            </p>
          </div>
          
          <div>
            <h3 className="mb-1 text-sm font-medium">설치 가능 여부</h3>
            <p className="text-xs text-gray-500">
              {installPrompt 
                ? '이 앱을 홈 화면에 설치할 수 있습니다' 
                : '이미 설치되었거나 설치 조건이 충족되지 않았습니다'}
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-white border border-gray-200 rounded-md">
          <h2 className="mb-4 text-lg font-medium text-gray-900">푸시 알림 설정</h2>
          <PushNotificationToggle />
          
          {subscription && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isEndpointDeprecated ? "bg-yellow-500" : "bg-green-500"}`}></div>
                <p className={`text-xs ${isEndpointDeprecated ? "text-yellow-600" : "text-green-600"}`}>
                  {isEndpointDeprecated 
                    ? "구형 엔드포인트 형식 감지됨 (오류 발생 가능)" 
                    : "정상적인 구독 상태"}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={showEndpointInfo}
                  className="text-xs text-blue-500 underline"
                >
                  엔드포인트 정보 보기
                </button>
                
                {isEndpointDeprecated && (
                  <button
                    onClick={renewSubscription}
                    className="text-xs text-red-500 underline"
                  >
                    구독 갱신하기
                  </button>
                )}
              </div>
              
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">알림 권한 상태</h3>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    permissionStatus?.state === 'granted' ? 'bg-green-500' : 
                    permissionStatus?.state === 'denied' ? 'bg-red-500' : 
                    'bg-yellow-500'}`}></div>
                  <p className="text-xs text-gray-600">
                    {permissionStatus?.state === 'granted' ? '허용됨' : 
                     permissionStatus?.state === 'denied' ? '거부됨' : 
                     permissionStatus?.state === 'prompt' ? '확인 필요' : '알 수 없음'}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {permissionStatus?.state === 'denied' && 
                    '브라우저 설정에서 알림이 차단되었습니다. 푸시 알림을 받으려면 설정을 변경해야 합니다.'}
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">구독 유효성 관리</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={validateSubscription} 
                    className="px-3 py-1 text-xs text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    disabled={isPushLoading}
                  >
                    {isPushLoading ? '검사 중...' : '구독 유효성 검사'}
                  </button>
                  
                  <button 
                    onClick={openNotificationSettings} 
                    className="px-3 py-1 text-xs text-white bg-gray-500 rounded-md hover:bg-gray-600"
                  >
                    브라우저 알림 설정
                  </button>
                </div>
                {lastChecked && (
                  <p className="mt-1 text-xs text-gray-500">
                    마지막 확인: {lastChecked}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-4 bg-white border border-gray-200 rounded-md">
          <h2 className="text-lg font-medium text-gray-900">테스트 기능</h2>
          
          <div>
            <Button text="브라우저 알림 테스트" onClick={sendTestNotification} />
            <p className="mt-1 text-xs text-gray-500">
              브라우저가 열려있을 때만 작동하는 로컬 알림을 테스트합니다
            </p>
          </div>
          
          <div>
            <Button 
              text={isPushLoading ? "푸시 알림 전송 중..." : "푸시 알림 테스트"} 
              onClick={testPushNotification}
              disabled={isPushLoading || !subscription || !user?.id}
            />
            <p className="mt-1 text-xs text-gray-500">
              브라우저가 닫혀있어도 작동하는 실제 푸시 알림을 테스트합니다
              {!subscription && " (먼저 푸시 알림을 활성화하세요)"}
              {!user?.id && " (로그인이 필요합니다)"}
            </p>
          </div>
          
          <div>
            <Button text="서비스 워커 메시지 테스트" onClick={testServiceWorkerMessage} />
            <p className="mt-1 text-xs text-gray-500">
              서비스 워커와의 메시지 통신을 테스트합니다
            </p>
          </div>
          
          <div>
            <Button text="오프라인 모드 시뮬레이션" onClick={simulateOffline} />
            <p className="mt-1 text-xs text-gray-500">
              개발자 도구를 사용해 오프라인 모드를 테스트합니다
            </p>
          </div>
          
          {installPrompt && (
            <div>
              <Button text="앱 설치하기" onClick={showInstallPrompt} />
              <p className="mt-1 text-xs text-gray-500">
                이 앱을 홈 화면에 설치합니다
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
