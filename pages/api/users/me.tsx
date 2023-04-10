import { withApiSession } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  console.log(`confirm--Cookies requested: ${JSON.stringify(req.cookies, null, 2)}`);
  console.log("confirm--req.session: ", req.session);

  const profile = await client.user.findUnique({
    where: {
      id: req.session.user?.id,
    },
  });
  res.status(200).json({ ok: true, profile });
};

export default withApiSession(withHandler("GET", handler));
