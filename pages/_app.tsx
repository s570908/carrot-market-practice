// import Script from "next/script";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SWRConfig } from "swr";

// QueryClient 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  // console.log("APP IS RUNNING");

  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig
        value={{
          fetcher: (url: string) => fetch(url).then((res) => res.json()),
        }}
      >
        <div className="mx-auto w-full min-w-[360px] max-w-xl">
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
      </SWRConfig>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}

export default MyApp;
