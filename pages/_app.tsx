// import { SWRConfig } from "swr";
import Script from "next/script";
import "../styles/globals.css";
import type { AppProps } from "next/app";

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
    <div>
      <div className="mx-auto w-full max-w-xl">
        <Component {...pageProps} />
      </div>
      <Script src="https://developers.kakao.com/sdk/js/kakao.js" strategy="lazyOnload" />
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        onLoad={() => {
          console.log("facebook SDK loaded.");
          // @ts-ignore
          window.fbAsyncInit = function () {
            // @ts-ignore
            // FB.init({
            //   appId: "your-app-id",
            //   autoLogAppEvents: true,
            //   xfbml: true,
            //   version: "v14.0",
            // });
          };
        }}
      />
    </div>
  );
}

export default MyApp;
