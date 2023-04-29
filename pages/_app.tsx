// import { SWRConfig } from "swr";
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
    <div className="mx-auto w-full max-w-xl">
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
