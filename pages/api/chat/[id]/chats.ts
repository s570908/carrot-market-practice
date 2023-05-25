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
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const sellerChat = await client.sellerChat.create({
    data: {
      chatMsg: body.chatMsg,
      chatRooms: {
        connect: {
          id: +id.toString(),
        },
      },
      chatRoomId: +id.toString(),
      user: {
        connect: {
          id: user?.id,
        },
      },
      isNew: true,
    },
  });
  res.json({ ok: true, sellerChat });
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
