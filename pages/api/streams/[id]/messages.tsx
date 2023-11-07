import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id },
    body,
    session: { user },
  } = req;
  // const page = req.query.page ? (req.query.page as String) : "";
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const streamMessage = await client.message.create({
    data: {
      message: body.message,
      stream: {
        connect: {
          id: +id,
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
