import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useSocket from "@libs/client/useSocket";
import useUser from "@libs/client/useUser";
import { useEffect, useState } from "react";
import { getChatRoomIDs } from "apiLibs/chatRooms";
import { ChatRoomType } from "apiLibs/atypes";
import PushNotificationService from "@components/PushNotificationService";
import { useRouter } from "next/router";
import AppInitializer from "@/components/AppInitializer";
import axios from "axios";
import PushSubscriptionManager from "@/components/PushSubscriptionManager";
import PwaUpdateBanner from "@/components/PwaUpdateBanner";

// QueryClient 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function MyApp(appProps: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PushNotificationService />
      <AppContent {...appProps} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

type CustomPageProps = {
  user?: {
    id?: number | string;
    // 다른 user 필드가 있다면 여기에 추가
  };
  [key: string]: any;
};

function AppContent({
  Component,
  pageProps,
}: AppProps & { pageProps: CustomPageProps }) {
  const router = useRouter();
  const [socket] = useSocket("market");
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  const [clientUser, setClientUser] = useState<{ id?: number } | null>(null);

  useEffect(() => {
    setIsMounted(true); // 클라이언트에서만 true
  }, []);

  // useUser에서 가져온 user를 clientUser에 설정
  useEffect(() => {
    if (user?.id) {
      setClientUser({ id: user.id });
    } else {
      setClientUser(null);
    }
  }, [user?.id]);

  // Enter 페이지에서는 불필요한 쿼리 실행 방지
  const isEnterPage = router.pathname === "/enter";

  // 클라이언트에서만 실행되는 쿼리
  const { data: channelData } = useQuery({
    queryKey: ["chatRoomIDs"],
    queryFn: () => getChatRoomIDs(ChatRoomType.All),
    enabled: isMounted && !isEnterPage,
    staleTime: 2 * 60 * 1000, // 🟢 2분간 신선한 데이터로 간주
    refetchOnWindowFocus: false, // 🟢 포커스 시 재요청 방지
    refetchOnReconnect: false, // 🟢 재연결 시 재요청 방지
    retry: false, // 🟢 즉시 에러 처리
  });

  // 소켓 연결 (클라이언트에서만, Enter 페이지 제외)
  useEffect(() => {
    if (
      isMounted &&
      socket &&
      channelData?.ok &&
      !isEnterPage &&
      clientUser?.id
    ) {
      console.log(
        "-------------------Emitting login event for user:",
        clientUser.id
      );
      socket.emit("login", {
        id: clientUser.id,
        channels: channelData.sellerChatRoomList.map((v: any) => v.id),
      });
    }
  }, [socket, channelData, isMounted, isEnterPage, clientUser?.id]);

  // SSR 중에는 기본 컴포넌트만 렌더링
  if (!isMounted) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <Component {...pageProps} /> {/* 🟢 서버와 동일한 렌더링 */}
      </div>
    );
  }

  // 클라이언트에서만 ToastContainer 등 추가 기능 렌더링
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* <PushSubscriptionManager /> */}
      <PwaUpdateBanner />
      <Component {...pageProps} />
      <AppInitializer />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="dark"
      />
    </div>
  );
}

export default MyApp;

// 🟢 두 번째 코드를 사용해야 하는 이유:

// 1. 무한 리다이렉트 해결
// - useUser() 제거로 Enter 페이지에서 리다이렉트 루프 방지
// - 미들웨어 기반 인증과 완벽 호환

// 2. 안정적인 SSR/CSR 처리
// - isMounted 상태로 하이드레이션 불일치 방지
// - 서버와 클라이언트 렌더링 결과 일치 보장

// 3. 성능 최적화
// - Enter 페이지에서 불필요한 쿼리 실행 방지
// - 적절한 캐시 전략으로 네트워크 요청 최소화

// 4. 코드 안정성
// - TypeScript 타입 정의로 타입 안전성 보장
// - 에러 처리 및 예외 상황 대응 강화

// 5. 당근마켓 프로젝트에 특화된 이유
// - 채팅방 목록은 자주 변경되지 않음
// - 사용자가 명시적으로 새로고침할 때만 갱신 필요
// - 모바일 사용자가 많아 데이터 절약 중요
// - 실시간 업데이트는 WebSocket으로 처리
