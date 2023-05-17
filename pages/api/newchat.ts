import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    session: { user },
  } = req;
  const newChat = await client.chatRoom.findMany({
    where: {
      OR: [{ buyerId: user?.id }, { sellerId: user?.id }],
    },
    select: {
      recentMsg: {
        select: {
          isNew: true,
          userId: true,
        },
      },
    },
  });
  res.json({
    ok: true,
    newChat,
  });
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
