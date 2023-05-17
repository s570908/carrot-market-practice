import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    body,
    session: { user },
  } = req;
  const id = req.query.id ? (req.query.id as String) : ""; // product id
  const streamMessage = await client.message.create({
    data: {
      message: body.message,
      stream: {
        connect: {
          id: +id.toString(),
        },
      },
      user: {
        connect: {
          id: user?.id,
        },
      },
    },
  });

  res.json({ ok: true, streamMessage });
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
