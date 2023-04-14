import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

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
  const foundToken = await client.token.findUnique({
    where: {
      payload: token,
    },
    include: {
      user: true,
    },
  });
  // request.body.token을 이용하여 DB에서 token을 찾는다. token을 가져올 때 user도 가져온다.

  // console.log("confirm--token: ", token);
  // console.log("confirm--foundToken: ", foundToken);
  // console.log(`confirm--Cookies requested: ${JSON.stringify(req.cookies, null, 2)}`);
  // console.log("confirm--req.session before save: ", req.session);

  if (!foundToken) {
    res.status(404).end();
  } else {
    req.session.user = {
      id: foundToken.userId,
    };
  }

  await req.session.save();

  // console.log("confirm--req.session after save: ", req.session);

  // 모든 토큰을 지워준다.
  await client.token.deleteMany({
    where: {
      userId: foundToken?.userId,
    },
  });

  // console.log("confirm successful!");

  res.status(200).json({ ok: true });
  // 주의! res.status(200).end({ ok: true})로 하면 안된다. json 형태의 args는 .json()을 사용한다.
};

export default withApiSession(withHandler({ method: "POST", handler, isPrivate: false }));

//export default withHandler("POST", handler);
