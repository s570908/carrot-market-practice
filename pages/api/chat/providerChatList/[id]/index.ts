import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const {
      query: { id }, // productId
      session: { user },
    } = req;
    const providerChatRoomList = await client.chatRoom.findMany({
      where: {
        AND: [{ sellerId: user?.id }, {productId: id}],
      },
      include: {
        recentMsg: {
          select: {
            chatMsg: true,
            isNew: true,
            userId: true,
          },
        },
        seller: {
          select: {
            name: true,
            avatar: true,
            id: true,
          },
        },
      },
    });
    res.json({
      ok: true,
      providerChatRoomList,
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler, isPrivate: true })
);
