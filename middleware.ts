import { NextRequest, NextResponse } from "next/server";
// Next.js 서버 미들웨어에 필요한 타입과 응답 객체를 import
// NextRequest: Express의 req와 유사하지만 Next.js에 특화된 요청 객체 타입
// NextResponse: redirect, rewrite, next 등의 메서드를 제공하는 응답 객체 타입

export function middleware(req: NextRequest) {
// 미들웨어 메인 함수 - 모든 HTTP 요청에 대해 페이지 렌더링 전에 실행됨
// "middleware"라는 함수명은 Next.js 컨벤션 (반드시 이 이름이어야 함)
// export 키워드로 내보내야 Next.js가 자동으로 인식

  // 서버에서 실행되는 코드
  const pathname = req.nextUrl.pathname;
  // 요청된 URL의 경로 부분만 추출
  // 예: "http://localhost:3000/chats/123?param=value" → "/chats/123"
  // req.url 대신 req.nextUrl.pathname을 사용하는 이유: 더 안전하고 정확함

  const hasSession = req.cookies.get("carrotsession");
  // 쿠키에서 세션 정보 확인
  // get() 메서드는 쿠키가 존재하면 Cookie 객체를 반환, 없으면 undefined 반환
  // "carrotsession"은 이 당근마켓 프로젝트의 세션 쿠키명

  console.log(`[Middleware] ${req.method} ${pathname} - Session: ${hasSession ? 'Yes' : 'No'}`);
  // 디버깅용 로그 출력 - 요청 메서드(GET, POST), 경로, 세션 존재 여부를 기록
  // 개발 중 미들웨어가 언제 어떻게 동작하는지 추적하기 위한 목적
  // req.method: HTTP 메서드 (GET, POST, PUT, DELETE 등)

  // config.matcher에서 이미 처리한 조건들은 제외하고
  // 미들웨어 내에서는 matcher에서 처리하지 않는 조건만 추가로 체크
  
  // 추가 제외 경로: config.matcher에서 처리되지 않은 것들만 명시
  //////////////////////////////////////////
  // "비즈니스 상 제외가 필요하면 여기에 추가"
  /////////////////////////////////////////
  const additionalExcludedPaths: any[] = [
  // 예시: "/special-case/", "/legacy-api/"
  ];

  if (additionalExcludedPaths.some(path => pathname.startsWith(path))) {
  // 조건: 추가 제외 경로 배열 중 하나라도 현재 경로와 일치하는지 확인

    console.log(`[Middleware] 추가 제외된 경로: ${pathname}`);
    // 추가 제외된 경로임을 콘솔에 로그로 기록 (디버깅용)

    return NextResponse.next();
    // NextResponse.next(): 미들웨어 처리를 건너뛰고 다음 단계(페이지 렌더링)로 진행
    // 즉, 인증 체크 없이 바로 요청된 리소스를 브라우저에 제공
  }

  // 2단계: 공개 페이지들 (로그인 없이도 접근 가능한 페이지들)
  const publicPaths = [
    "/",                    // 홈페이지 (상품 목록)
    "/enter",               // 🟢 로그인 페이지 - 공개 접근 허용
    "/products",            // 상품 목록 페이지
    "/products/[id]",       // 상품 상세 페이지 (실제로는 /products/123 형태)
    "/community",           // 동네생활 게시판 목록
    "/community/[id]",      // 동네생활 게시글 상세
    "/blog",                // 공지사항/블로그
    "/about",               // 소개 페이지 (있다면)
    "/help",                // 도움말 페이지 (있다면)
    "/terms",               // 이용약관 (있다면)
    "/privacy",             // 개인정보처리방침 (있다면)
  ];
  // 로그인 없이도 누구나 접근할 수 있는 페이지들을 배열로 정의
  // [id] 패턴은 Next.js의 동적 라우트를 나타냄 (실제로는 /products/123 같은 형태)

  // 동적 라우트 처리를 위한 패턴 매칭
  const isPublicPath = publicPaths.some(publicPath => {
  // some() 메서드로 publicPaths 배열의 각 요소와 현재 pathname을 비교

    if (publicPath.includes('[id]')) {
    // 동적 라우트 패턴 ([id])이 포함된 경우 특별한 처리가 필요
    // 예: "/products/[id]"는 "/products/123", "/products/456" 등과 매칭되어야 함
    
      const pattern = publicPath.replace('[id]', '\\d+');
      // [id] 부분을 정규식 패턴 \\d+ (하나 이상의 숫자)로 치환
      // 예: "/products/[id]" → "/products/\\d+"
      // replace() 메서드: 문자열에서 특정 부분을 다른 문자열로 교체
      
      const regex = new RegExp(`^${pattern}$`);
      // 새로운 정규식 객체 생성
      // ^ : 문자열의 시작을 의미 (정확한 매칭을 위해)
      // $ : 문자열의 끝을 의미 (정확한 매칭을 위해)
      // 예: 최종 패턴은 "^/products/\\d+$"가 됨
      
      return regex.test(pathname);
      // test() 메서드: 현재 경로가 이 정규식 패턴과 정확히 일치하는지 테스트
      // 예: "/products/123"은 매칭됨, "/products/abc"는 매칭 안됨
      // 반환값: boolean (true/false)
    }
    
    return pathname === publicPath || pathname.startsWith(publicPath + '/');
    // 정적 경로의 경우 (동적 라우트가 아닌 경우):
    // 조건 1: pathname === publicPath - 정확히 일치하는지 확인
    // 조건 2: pathname.startsWith(publicPath + '/') - 하위 경로인지 확인
    // 예: publicPath가 "/products"인 경우
    //     "/products"는 정확히 일치 (조건 1)
    //     "/products/upload"는 하위 경로 (조건 2)
  });

  if (isPublicPath) {
  // 현재 요청된 경로가 공개 페이지로 판정된 경우
  
    // Enter 페이지는 인증 체크 없이 자유롭게 접근 가능
    console.log(`[Middleware] 공개 페이지 접근 허용: ${pathname}`);
    return NextResponse.next(); // 🟢 바로 통과
  }

  // 3단계: 보호된 페이지들 (로그인이 필요한 페이지들)
  const protectedPaths = [
    "/chats",               // 채팅 목록 페이지 - 개인적인 대화 내용
    "/chats/[id]",          // 개별 채팅방 페이지 - 특정 채팅방의 메시지들
    "/profile",             // 내 프로필 페이지 - 개인 정보
    "/profile/edit",        // 프로필 편집 페이지 - 개인 정보 수정
    "/profile/bought",      // 구매 내역 페이지 - 개인의 거래 기록
    "/profile/sold",        // 판매 내역 페이지 - 개인의 판매 기록
    "/profile/loved",       // 관심 목록 페이지 - 개인의 관심 상품들
    "/stream",              // 라이브 스트리밍 목록 - 개인화된 콘텐츠
    "/stream/create",       // 라이브 생성 페이지 - 콘텐츠 생성 권한 필요
    "/stream/[id]",         // 개별 라이브 페이지 - 특정 라이브 시청/참여
    "/products/upload",     // 상품 등록 페이지 - 판매자만 접근 가능
    "/products/[id]/edit",  // 상품 수정 페이지 - 상품 소유자만 수정 가능
    "/community/write",     // 동네생활 글쓰기 페이지 - 커뮤니티 참여 권한 필요
    "/community/[id]/edit", // 동네생활 글수정 페이지 - 글 작성자만 수정 가능
    "/appointments",        // 약속 관리 페이지 - 개인의 약속 목록
    "/appointments/create", // 약속 생성 페이지 - 약속 생성 권한 필요
    "/appointments/[id]",   // 개별 약속 페이지 - 특정 약속의 상세 정보
    "/notifications",       // 알림 목록 페이지 - 개인의 알림들
    "/settings",            // 설정 페이지 - 개인 설정 관리
    "/admin",               // 관리자 페이지 (있다면) - 관리자 권한 필요
  ];
  // 로그인이 필요한 페이지들을 배열로 정의
  // 이런 페이지들은 개인정보나 개인화된 콘텐츠를 다루므로 인증이 필수
  
  const isProtectedPath = protectedPaths.some(protectedPath => {
  // 공개 페이지와 동일한 방식으로 보호된 페이지인지 매칭
  // some() 메서드로 protectedPaths 배열의 각 요소와 현재 pathname 비교
  
    if (protectedPath.includes('[id]')) {
    // 동적 라우트 패턴이 포함된 경우 특별 처리
    // 예: "/chats/[id]"는 "/chats/123", "/chats/456" 등과 매칭되어야 함
    
      const pattern = protectedPath.replace('[id]', '\\d+');
      // [id]를 숫자 패턴 \\d+로 치환
      // 예: "/chats/[id]" → "/chats/\\d+"
      
      const regex = new RegExp(`^${pattern}$`);
      // 정규식 객체 생성 (정확한 매칭을 위해 ^ $ 사용)
      
      return regex.test(pathname);
      // 현재 경로가 이 패턴과 일치하는지 테스트
    }
    
    return pathname === protectedPath || pathname.startsWith(protectedPath + '/');
    // 정적 경로의 경우: 정확한 일치 또는 하위 경로 확인
    // 예: "/profile"과 "/profile/edit" 모두 보호된 페이지로 처리
  });

  // 4단계: 보호된 페이지에 비로그인 상태로 접근
  if (isProtectedPath && !hasSession) {
  // 조건: 현재 페이지가 보호된 페이지이면서 동시에 세션이 없는 경우
  // 즉, 로그인이 필요한 페이지에 로그인하지 않은 상태로 접근한 경우
  
    console.log(`[Middleware] 🔒 보호된 페이지 접근 차단: ${pathname} → /enter`);
    // 접근 차단을 로그로 기록 (🔒 이모지로 보안 액션임을 표시)
    
    return NextResponse.redirect(new URL("/enter", req.url));
    // 로그인 페이지로 리다이렉트
    // new URL("/enter", req.url): 현재 도메인을 기준으로 /enter 경로의 완전한 URL 생성
    // redirect(): 브라우저에게 다른 URL로 이동하라고 지시 (HTTP 302 상태 코드)
    // 사용자는 자동으로 로그인 페이지로 이동하게 됨
  }

  // 5단계: 로그인된 상태에서 로그인 페이지 접근
  if (pathname === "/enter" && hasSession) {
  // 조건: 현재 페이지가 로그인 페이지이면서 동시에 세션이 있는 경우
  // 즉, 이미 로그인된 사용자가 로그인 페이지에 접근한 경우  
    return NextResponse.redirect(new URL("/", req.url));
    // 홈페이지로 리다이렉트
    // 이미 로그인되어 있으니 로그인 페이지에 있을 필요가 없음
    // 사용자 경험 향상: 불필요한 페이지 방문 방지
  }

  // 6단계: 알 수 없는 경로는 기본적으로 통과 (404는 Next.js가 처리)
  console.log(`[Middleware] ✅ 기본 통과: ${pathname}`);
  // 위의 모든 조건에 해당하지 않는 경로에 대한 기본 통과를 로그로 기록
  // ✅ 이모지로 정상 통과임을 표시  
  return NextResponse.next();
  // 미들웨어 처리를 마치고 다음 단계(페이지 렌더링)로 진행
  // Next.js가 해당 경로에 맞는 페이지를 찾아 렌더링하거나
  // 페이지가 없으면 자동으로 404 페이지를 보여줌
}

export const config = {
// 미들웨어 설정 객체 - Next.js에게 언제 미들웨어를 실행할지 알려주는 설정
// 이 객체도 export되어야 Next.js가 인식할 수 있음

  matcher: [
    // 모든 제외 조건을 여기서 한 번에 처리
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|service-worker.js|manifest.json|.*\\.).*)",
  ],
};
    // 복잡한 정규식을 단계별로 해부:
    // 
    // /( ... ) : 전체 패턴을 그룹으로 묶음
    // 
    // (?! ... ) : 부정 전방탐색(negative lookahead)
    //             괄호 안의 패턴이 뒤따라오지 않는 경우만 매칭
    // 
    // api : "/api/"로 시작하는 모든 경로를 제외
    //       예: /api/users/me, /api/chats 등은 미들웨어 실행 안함
    // 
    // _next/static : Next.js 정적 파일들을 제외
    //                예: /_next/static/css/styles.css 등
    // 
    // _next/image : Next.js 이미지 최적화 파일들을 제외
    //               예: /_next/image?url=/profile.jpg 등
    // 
    // favicon.ico : 파비콘 파일을 제외
    // 
    // images : 정적 이미지 파일들이 저장된 public/images/ 디렉토리
    // icons : 아이콘 파일들이 저장된 public/icons/ 디렉토리
    // service-worker.js : PWA의 서비스 워커 파일
    // manifest.json : PWA 웹 앱 매니페스트 파일
    // 
    // .*\\. : 확장자가 있는 모든 파일을 제외
    //         .* (임의의 문자들) + \\. (점 문자, 이스케이프됨)
    //         예: style.css, script.js, image.png 등
    // 
    // .* : 위 조건들을 만족하지 않는 나머지 모든 문자들과 매칭
    // 
    // 결과적으로 이 정규식은:
    // "API, Next.js 내부 파일, 정적 파일을 제외한 모든 페이지 라우트"에만
    // 미들웨어를 적용한다는 의미
// 이 설정으로 인해 실제 페이지 요청에만 인증 체크가 이루어지고,
// 시스템 파일이나 정적 리소스는 성능상의 이유로 미들웨어를 거치지 않음




