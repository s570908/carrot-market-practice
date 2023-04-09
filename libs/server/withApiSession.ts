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

export default function withApiSession(fn: any) {
  return withIronSessionApiRoute(fn, cookieOption);
}
