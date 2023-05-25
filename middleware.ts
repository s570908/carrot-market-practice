// import type { NextRequest, NextFetchEvent } from "next/server";

// export function middleware(request: NextRequest, event: NextFetchEvent) {
//   console.log("전역 미들웨어입니다.");
// }

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

declare global {
  interface String {
    includesOneOf(arrayOfStrings: string[]): boolean;
  }
}

// 'Hi, hope you like this option'.toLowerCase().includesOneOf(["hello", "hi", "howdy"]) // True
// https://stackoverflow.com/questions/37896484/multiple-conditions-for-javascript-includes-method
String.prototype.includesOneOf = function (arrayOfStrings: string[]): boolean {
  if (!Array.isArray(arrayOfStrings)) {
    throw new Error("includesOneOf only accepts an array");
  }
  return arrayOfStrings.some((str) => this.includes(str));
};

// https://velog.io/@pds0309/nextjs-%EB%AF%B8%EB%93%A4%EC%9B%A8%EC%96%B4%EB%9E%80
// 문서보며 알아보는 nextjs 미들웨어
export function middleware(req: NextRequest) {
  if (!req.url.includesOneOf(["/enter"]) && !req.cookies.get("carrotsession")) {
    return NextResponse.rewrite(new URL("/enter", req.url));
  } else if (req.url.includes("/enter") && req.cookies.get("carrotsession")) {
    return NextResponse.rewrite(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)", // 페이지에 접근하는 url만 미들웨어가 동작하게 만든다.
  ],
};
