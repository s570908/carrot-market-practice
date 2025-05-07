/* eslint-disable @next/next/no-sync-scripts */
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 
         * 1. rel="preconnect": 도메인과의 연결 설정
         * - DNS, TCP, TLS 연결을 미리 설정
         * - 약 300ms ~ 500ms 정도의 연결 시간 절약
         * - 리소스 요청 전에 연결만 준비
         */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://apis.openapi.sk.com"
          crossOrigin="anonymous"
        />

        {/* 
         * 2. rel="preload": 리소스 자체를 미리 로드
         * - as 속성으로 리소스 유형 명시 (script, style, font 등)
         * - 브라우저의 메인 렌더링을 차단하지 않음
         * - 현재 페이지에서 곧 필요한 중요 리소스에 사용
         */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap"
        />

        {/* 3. 실제 리소스 사용: preload된 리소스를 실제로 적용 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap"
          rel="stylesheet"
        />
        <script
          src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_APP_KEY}`}
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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
