import { useEffect, useState } from "react";

export default function ServiceWorkerStatus() {
  const [status, setStatus] = useState<string>("확인 중...");
  const [installable, setInstallable] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

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
    </div>
  );
}
