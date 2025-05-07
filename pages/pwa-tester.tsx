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
  
  // 푸시 알림 및 사용자 정보
  const { subscription } = usePushNotification();
  const { user } = useUser();

  useEffect(() => {
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


  /**
   * 설치 프롬프트 (Install Prompt)
   * 
   * 1. 개념:
   *    - 브라우저가 제공하는 네이티브 UI 프롬프트
   *    - 사용자에게 PWA를 설치할 수 있는 옵션을 제공
   *    - 모바일에서는 "홈 화면에 추가" 형태로 표시
   *    - 데스크톱에서는 주소 표시줄 옆에 설치 아이콘으로 표시
   * 
   * 2. 발생 조건:
   *    - manifest.json이 올바르게 구성됨
   *    - HTTPS 프로토콜 사용
   *    - 서비스 워커가 등록됨
   *    - 최소 192x192px 크기의 아이콘 정의
   *    - 처음 설치하는 경우
   * 
   * 3. 동작 방식:
   *    - beforeinstallprompt 이벤트 발생
   *    - 이벤트 객체를 저장해두었다가
   *    - 사용자 액션(버튼 클릭 등)에 응답하여 표시
   */  /**
   * 설치 프롬프트 (Install Prompt)
   * 
   * 1. 개념:
   *    - 브라우저가 제공하는 네이티브 UI 프롬프트
   *    - 사용자에게 PWA를 설치할 수 있는 옵션을 제공
   *    - 모바일에서는 "홈 화면에 추가" 형태로 표시
   *    - 데스크톱에서는 주소 표시줄 옆에 설치 아이콘으로 표시
   * 
   * 2. 발생 조건:
   *    - manifest.json이 올바르게 구성됨
   *    - HTTPS 프로토콜 사용
   *    - 서비스 워커가 등록됨
   *    - 최소 192x192px 크기의 아이콘 정의
   *    - 처음 설치하는 경우
   * 
   * 3. 동작 방식:
   *    - beforeinstallprompt 이벤트 발생
   *    - 이벤트 객체를 저장해두었다가
   *    - 사용자 액션(버튼 클릭 등)에 응답하여 표시
   */
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      
  
      // 디버깅용 로그    // 디버깅용 로그
      console.log('설치 프롬프트 준비됨:', {
        platform: navigator.platform,
        vendor: navigator.vendor,
        userAgent: navigator.userAgent
      });
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
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

  // 브라우저 알림 테스트 (로컬 알림 - 브라우저가 열려있을 때만 작동)
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

  // 푸시 알림 테스트 (원격 알림 - 브라우저가 닫혀있어도 작동)
  const testPushNotification = async () => {
    if (!subscription) {
      alert("푸시 알림이 비활성화되어 있습니다. 먼저 푸시 알림을 활성화하세요.");
      return;
    }

    if (!user?.id) {
      alert("사용자 정보를 불러올 수 없습니다. 로그인 상태를 확인하세요.");
      return;
    }

    try {
      setIsPushLoading(true);
      // 기존 send.ts API 엔드포인트 활용
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: user.id, // 자신에게 테스트 알림 전송
          title: "푸시 알림 테스트",
          body: "원격 푸시 알림 테스트입니다. 브라우저가 닫혀있어도 작동합니다.",
          icon: "/icons/icon-192x192.png",
          data: {
            url: "/pwa-tester", // 클릭 시 이동할 URL
            testInfo: "이것은 테스트 데이터입니다",
          },
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
