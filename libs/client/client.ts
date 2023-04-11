import { PrismaClient } from "@prisma/client";

declare global {
  var client: PrismaClient | undefined;
}
// 이 파일에 import 가 사용되었으므로 이 모듈은 로컬모듈이다.
// client를 전역변수(global)로 만들고 싶으면 declare global을 사용한다.

// client가 global에 저장이 안되어 있을 경우에만 새로 생성한다.
const client = global.client || new PrismaClient();

// development라면 global을 나중에 설정해 주어야 한다.
// https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices

// development 모드에서 hot reloading을 사용할 경우, hot reloading이 될 때마다, PrismaClient가 construct된다.
// 즉 database connection이 만들어 진다. 나중에는 database connection이 고갈될 수 있다.
// 이를 방지하기 위해서 생성된 client를 global에 저장해둔다. client가 global에 저장이 안되어 있을 경우에만 새로 생성한다.
if (process.env.NODE_ENV !== "production") global.client = client;

export default client;

// Prisma Client가 여러번 생성되는 것을 막기 위하여 전역으로 client를 만들고 만약에 있다면 다시 생성하지 않는 방법을 채택하여,
// 여러번 instance가 생성되지 않게 해보겠습니다.

/* 
https://bum-developer.tistory.com/entry/TypeScript-Declare-Ambient-Module

타입스크립트 파일은 import / export 문법이 있냐 없냐에 따라 글로벌 모듈 / 로컬 모듈로 나뉜다. 
import / export 가 하나라도 있으면 그 파일은 글로별 모듈이다.
import / export 가 전혀 없으면 그 파일은 로컬 모듈이다.

근데 로컬 모듈에서 전역으로 변수를 만들고 싶을 경우가 있다면, declare global를 사용하면 된다. 

declare global {
    type Dog = string
} 

여기서 type Dog은 전역 타입변수가 된다.
*/
