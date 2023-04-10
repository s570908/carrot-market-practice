import { withIronSessionApiRoute } from "iron-session/next";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: number;
    };
  }
}

const cookieOption = {
  cookieName: "carrotsession",
  password: "2039847509283745098273409587asdfasdfasdfasdfasdfasdfasdf",
};

export function withApiSession(fn: any) {
  return withIronSessionApiRoute(fn, cookieOption);
}
