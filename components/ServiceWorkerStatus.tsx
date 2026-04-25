import { useEffect, useState } from "react";
import { initializePushSubscription } from "@/libs/client/pushUtils";

export default function ServiceWorkerStatus() {
  const [status, setStatus] = useState<string>("확인 중...");
  const [installable, setInstallable] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>("");

  useEffect(() => {
    // 서비스 워커 지원 확인
    if ("serviceWorker" in navigator) {
      // 서비스 워커 등록 상태 확인
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          if (registrations.length > 0) {
            setStatus("서비스 워커가 설치되었습니다.");
            console.log("설치된 서비스 워커:", registrations);
          } else {
            setStatus("서비스 워커가 설치되지 않았습니다.");
          }
        })
        .catch((error) => {
          setStatus(`서비스 워커 확인 오류: ${error.message}`);
          console.error("서비스 워커 확인 오류:", error);
        });

      // 서비스 워커 메시지 리스너
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("서비스 워커로부터 메시지 수신:", event.data);
      });
    } else {
      setStatus("이 브라우저는 서비스 워커를 지원하지 않습니다.");
    }

    // PWA 설치 가능 여부 확인
    window.addEventListener("beforeinstallprompt", (e) => {
      // 설치 프롬프트 이벤트 저장
      e.preventDefault();
      setInstallPrompt(e);
      setInstallable(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  // PWA 설치 함수
  const installPWA = () => {
    if (!installPrompt) return;

    // 설치 프롬프트 표시
    installPrompt.prompt();

    // 사용자 응답 확인
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        console.log("사용자가 PWA 설치를 수락했습니다.");
      } else {
        console.log("사용자가 PWA 설치를 거부했습니다.");
      }
      setInstallPrompt(null);
      setInstallable(false);
    });
  };

  // 알림 테스트 함수
  const testNotification = async () => {
    setNotificationStatus("알림 권한 확인 중...");
    
    try {
      // 0. 브라우저 환경 및 기능 지원 여부 사전 확인
      if (typeof window === "undefined") {
        setNotificationStatus("❌ 푸시 구독 실패: 브라우저 환경이 아닙니다.");
        return;
      }
      
      if (!('serviceWorker' in navigator)) {
        setNotificationStatus("❌ 푸시 구독 실패: 이 브라우저는 서비스 워커를 지원하지 않습니다.");
        return;
      }
      
      if (!('PushManager' in window)) {
        setNotificationStatus("❌ 푸시 구독 실패: 이 브라우저는 푸시 알림을 지원하지 않습니다.");
        return;
      }
      
      if (!('Notification' in window)) {
        setNotificationStatus("❌ 푸시 구독 실패: 이 브라우저는 알림 API를 지원하지 않습니다.");
        return;
      }
      
      // 알림 권한 상태 확인
      if (Notification.permission === 'denied') {
        setNotificationStatus("❌ 푸시 구독 실패: 알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.");
        return;
      }
      
      // VAPID 키 확인
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        setNotificationStatus("❌ 푸시 구독 실패: VAPID 공개 키가 설정되지 않았습니다.");
        return;
      }
      
      // 서비스 워커 등록 확인
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setNotificationStatus("⏳ 서비스 워커 등록 중...");
      }
      
      // 1. 푸시 구독 초기화 (권한 요청 + 구독)
      const subscription = await initializePushSubscription();
      
      if (!subscription) {
        // 추가 진단: 왜 null이 반환되었는지 확인
        const currentPermission = Notification.permission as NotificationPermission;
        const currentRegistration = await navigator.serviceWorker.getRegistration();
        
        if (currentPermission === 'denied') {
          setNotificationStatus("❌ 푸시 구독 실패: 사용자가 알림 권한을 거부했습니다.");
        } else if (currentPermission === 'default') {
          setNotificationStatus("❌ 푸시 구독 실패: 알림 권한이 요청되지 않았거나 무시되었습니다.");
        } else if (!currentRegistration) {
          setNotificationStatus("❌ 푸시 구독 실패: 서비스 워커 등록에 실패했습니다.");
        } else if (!currentRegistration.active) {
          setNotificationStatus("❌ 푸시 구독 실패: 서비스 워커가 활성화되지 않았습니다. 페이지를 새로고침해주세요.");
        } else {
          setNotificationStatus("❌ 푸시 구독 실패: 알 수 없는 오류가 발생했습니다. 콘솔을 확인해주세요.");
        }
        return;
      }
      
      setNotificationStatus("테스트 알림 전송 중...");
      
      // 2. 테스트 알림 전송 요청
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        },
      };
      
      const response = await fetch('/api/push-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: subscriptionData }),
      });
      
      if (response.ok) {
        setNotificationStatus("✅ 테스트 알림 전송 완료!");
      } else {
        const error = await response.json();
        setNotificationStatus(`❌ 알림 전송 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error("알림 테스트 오류:", error);
      setNotificationStatus(`❌ 오류: ${error.message}`);
    }
  };

  return (
    <div className="p-4 mb-4 bg-white border rounded-lg shadow-sm">
      <h3 className="mb-2 text-lg font-bold">서비스 워커 상태</h3>
      <p className="mb-2">{status}</p>

      {installable && (
        <button
          onClick={installPWA}
          className="px-4 py-2 text-white transition bg-orange-500 rounded hover:bg-orange-600"
        >
          앱 설치하기
        </button>
      )}

      <button
        onClick={() => {
          // 서비스 워커에 테스트 메시지 전송
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "TEST_MESSAGE",
              data: { timestamp: new Date().toISOString() },
            });
          }
        }}
        className="px-4 py-2 mt-2 text-white transition bg-blue-500 rounded hover:bg-blue-600"
      >
        서비스 워커 테스트
      </button>

      <button
        onClick={testNotification}
        className="px-4 py-2 mt-2 ml-2 text-white transition bg-green-500 rounded hover:bg-green-600"
      >
        알림 테스트
      </button>

      <button
        onClick={async () => {
          console.log("=== 🔍 PushManager 진단 시작 ===");
          console.log("1. Protocol:", location.protocol);
          console.log("2. PushManager 지원:", 'PushManager' in window);
          console.log("3. Notification 지원:", 'Notification' in window);
          console.log("4. 알림 권한:", Notification.permission);
          
          try {
            const reg1 = await navigator.serviceWorker.getRegistration();
            const reg2 = await navigator.serviceWorker.ready;
            
            console.log("\n=== ServiceWorker Registration 비교 ===");
            console.log("5. getRegistration() 결과:", reg1);
            console.log("6. ready 결과:", reg2);
            console.log("7. 같은 객체?:", reg1 === reg2);
            
            console.log("\n=== reg1 (getRegistration) 상세 ===");
            console.log("8. reg1.active:", reg1?.active);
            console.log("9. reg1.installing:", reg1?.installing);
            console.log("10. reg1.waiting:", reg1?.waiting);
            console.log("11. reg1.pushManager:", reg1?.pushManager);
            console.log("12. reg1.pushManager 타입:", typeof reg1?.pushManager);
            console.log("13. reg1.pushManager 키들:", reg1?.pushManager ? Object.keys(reg1.pushManager) : 'N/A');
            console.log("14. reg1.pushManager.getSubscription 존재:", typeof reg1?.pushManager?.getSubscription);
            
            console.log("\n=== reg2 (ready) 상세 ===");
            console.log("15. reg2.active:", reg2?.active);
            console.log("16. reg2.pushManager:", reg2?.pushManager);
            console.log("17. reg2.pushManager 타입:", typeof reg2?.pushManager);
            console.log("18. reg2.pushManager 키들:", reg2?.pushManager ? Object.keys(reg2.pushManager) : 'N/A');
            console.log("19. reg2.pushManager.getSubscription 존재:", typeof reg2?.pushManager?.getSubscription);
            
            // pushManager 메서드 테스트
            if (reg2?.pushManager?.getSubscription) {
              console.log("\n=== pushManager.getSubscription 테스트 ===");
              try {
                const subscription = await reg2.pushManager.getSubscription();
                console.log("20. 기존 구독:", subscription);
              } catch (e) {
                console.error("21. getSubscription 오류:", e);
              }
            }
            
            setNotificationStatus("✅ 진단 완료 - 콘솔(F12)을 확인하세요");
          } catch (error) {
            console.error("진단 오류:", error);
            setNotificationStatus(`❌ 진단 오류: ${(error as Error).message}`);
          }
        }}
        className="px-4 py-2 mt-2 ml-2 text-white transition bg-purple-500 rounded hover:bg-purple-600"
      >
        PushManager 진단
      </button>

      {notificationStatus && (
        <p className="mt-2 text-sm text-gray-600">{notificationStatus}</p>
      )}
    </div>
  );
}
