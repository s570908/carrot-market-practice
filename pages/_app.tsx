import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useUser from "@libs/client/useUser";
import useSocket from "@libs/client/useSocket";
import { useEffect } from "react";
import { getChatRoomIDs } from "apiLibs/chatRooms";
import { ChatRoomType } from "apiLibs/atypes";

// QueryClient 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function MyApp(appProps: AppProps) {
  useEffect(() => {
    // 서비스 워커 등록 - 앱 전체를 위한 단일 등록 지점
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 이미 등록된 서비스 워커가 있는지 확인
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) {
          // 등록된 서비스 워커가 없을 경우 새로 등록
          navigator.serviceWorker
            .register("/service-worker.js", { 
              scope: "/",
              // 서비스 워커에 푸시 기능도 포함되어 있음을 명시적으로 주석으로 표시
              // 이 서비스 워커는 캐싱, 오프라인 지원, 푸시 알림 등 모든 기능 담당
            })
            .then((registration) => {
              console.log("서비스 워커 등록 성공:", registration.scope);
              // 등록 후 새로고침하여 서비스 워커가 활성화되도록 함
              if (registration.installing) {
                registration.installing.addEventListener("statechange", (e) => {
                  if ((e.target as any).state === "activated") {
                    console.log("서비스 워커 활성화됨");
                  }
                });
              }
            })
            .catch((error) => {
              console.error("서비스 워커 등록 실패:", error);
            });
        } else {
          console.log("이미 등록된 서비스 워커가 있습니다:", registrations);
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent {...appProps} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// 이 함수는 useQuery를 QueryClientProvider로 감싸는 역할을 한다.
// 이렇게 하면 모든 페이지에서 useQuery를 사용할 수 있다.
function AppContent({ Component, pageProps }: AppProps) {
  const { user } = useUser();
  const [socket] = useSocket("market");

  const { data: channelData } = useQuery({
    queryKey: ["chatRoomIDs"],
    queryFn: () => getChatRoomIDs(ChatRoomType.All),
    enabled: !!user, // 사용자가 로그인한 경우에만 쿼리를 실행
  });

  // 로그인 유저가 어떤 페이지이든 reload하면, 자기가 속한 모든 채팅방을 서버에 알려준다.
  // 방법: 소켓에 로그인 이벤트를 보낸다.
  useEffect(() => {
    if (user && socket && channelData?.ok) {
      console.info("로그인 유저가 어떤 페이지이든지 reload하면 수행된다. socket: ", socket);
      socket.emit("login", {
        id: user.id,
        channels: channelData.sellerChatRoomList.map((v: any) => v.id),
      });
    }
  }, [socket, user, channelData]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Component {...pageProps} />
      <ToastContainer
        position="top-center" // 알람 위치 지정
        autoClose={3000} // 자동 off 시간
        hideProgressBar={true} // 진행시간바 숨김
        closeOnClick={false} // 클릭으로 알람 닫기
        rtl={false} // 알림 좌우 반전
        pauseOnFocusLoss={false} // 화면을 벗어나면 알람 정지
        draggable={false} // 드래그 가능
        pauseOnHover={false} // 마우스를 올리면 알람 정지
        theme="dark"
        // limit={1} // 알람 개수 제한
      />
    </div>
  );
}

export default MyApp;
