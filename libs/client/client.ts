import { PrismaClient } from "@prisma/client";

declare global {
  var client: PrismaClient | undefined;
}

// client가 global에 저장이 안되어 있을 경우에만 새로 생성한다.
const client = global.client || new PrismaClient();

// development라면 global을 나중에 설정해 주어야 한다.
// https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices

// development 모드에서 hot reloading을 사용할 경우, hot reloading이 될 때마다, PrismaClient가 construct된다.
// 즉 database connection이 만들어 진다. 나중에는 database connection이 고갈될 수 있다.
// 이를 방지하기 위해서 생성된 client를 global에 저장해둔다. client가 global에 저장이 안되어 있을 경우에만 새로 생성한다.
if (process.env.NODE_ENV !== "production") global.client = client;

export default client;
