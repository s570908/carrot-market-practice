// import Script from "next/script";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SWRConfig } from "swr";

function MyApp({ Component, pageProps }: AppProps) {
  console.log("APP IS RUNNING");

  return (
    // <SWRConfig
    //   value={{
    //     refreshInterval: 3000,
    //     fetcher: (url: string) => {
    //       fetch(url).then((response) => response.json());
    //     },
    //   }}
    // >    </SWRConfig>

    // <div>
    //   <div className="w-full max-w-xl mx-auto">
    //     <Component {...pageProps} />
    //   </div>
    //   <Script src="https://developers.kakao.com/sdk/js/kakao.js" strategy="lazyOnload" />
    //   <Script
    //     src="https://connect.facebook.net/en_US/sdk.js"
    //     onLoad={() => {
    //       console.log("facebook SDK loaded.");
    //       // @ts-ignore
    //       window.fbAsyncInit = function () {
    //         // @ts-ignore
    //         // FB.init({
    //         //   appId: "your-app-id",
    //         //   autoLogAppEvents: true,
    //         //   xfbml: true,
    //         //   version: "v14.0",
    //         // });
    //       };
    //     }}
    //   />
    // </div>

    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
      }}
    >
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
    </SWRConfig>
  );
}

export default MyApp;
