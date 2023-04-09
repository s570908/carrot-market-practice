import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import client from "@libs/client/client";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: number;
    };
  }
}

interface reqBodyType {
  token?: string;
}

// req.body.token을 이용하여 DB에서 token을 찾는다.
// findUnique()를 사용했으므로 where.payload는 unique해야한다.
// model Token에서
// payload   String   @unique 이어야 한다.
// 못 찾으면 에러를 송부한다. 찾았으면 .....
//    session의 id에 user.id를 저장한다.

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  // const token = req.body.token;
  const { token }: reqBodyType = req.body;
  const exists = await client.token.findUnique({
    where: {
      payload: token,
    },
    include: {
      user: true,
    },
  });
  // request.body.token을 이용하여 DB에서 token을 찾는다. token을 가져올 때 user도 가져온다.

  console.log("confirm--token: ", token);
  console.log("confirm--exists: ", exists);
  console.log(`confirm--Cookies requested: ${JSON.stringify(req.cookies, null, 2)}`);
  console.log("confirm--req.session: ", req.session);

  if (!exists) {
    res.status(404).end();
  } else {
    req.session.user = {
      id: exists.userId,
    };
  }

  await req.session.save();

  res.status(200).json({ ok: true, token });
  // 주의! res.status(200).end({ ok: true, token })로 하면 안된다. json 형태의 args는 .json()을 사용한다.
};

const cookieOption = {
  cookieName: "carrotsession",
  password: "2039847509283745098273409587asdfasdfasdfasdfasdfasdfasdf",
};

function withApiSession(fn: any) {
  return withIronSessionApiRoute(fn, cookieOption);
}

export default withApiSession(withHandler("POST", handler));

//export default withHandler("POST", handler);
