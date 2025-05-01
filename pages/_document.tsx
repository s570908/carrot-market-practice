/* eslint-disable @next/next/no-sync-scripts */
import Document, { Head, Html, Main, NextScript } from "next/document";

class CustomDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="ko">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap"
            rel="stylesheet"
          />
          {/* 정적 manifest.json 파일 사용 - rel 속성 수정 */}
          <link rel="/manifest" href="/manifest.json" />

          {/* PWA 기본 설정 */}
          <meta name="application-name" content="Soy Market" />
          <meta name="description" content="당신 근처의 중고 거래 마켓플레이스" />
          <meta name="theme-color" content="#ff9900" />

          {/* iOS PWA 지원 */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="Soy Market" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="mobile-web-app-capable" content="yes" />
          <link rel="apple-touch-icon" href="/icons/soy-bean-192-192.png" />

          {/* Tmap JS SDK */}
          <script
            src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_APP_KEY}`}
          ></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default CustomDocument;
