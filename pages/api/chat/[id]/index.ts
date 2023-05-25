import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id },
    session: { user },
  } = req;
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const sellerChat = await client.sellerChat.findMany({
    where: {
      chatRoomId: +id.toString(),
    },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });
  const seller = await client.chatRoom.findUnique({
    where: {
      id: +id.toString(),
    },
    include: {
      buyer: {
        select: {
          name: true,
          avatar: true,
        },
      },
      seller: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });
  sellerChat.map(async (chat) => {
    if (chat.userId !== user?.id) {
      await client.sellerChat.updateMany({
        where: {
          AND: [{ chatRoomId: +id.toString() }, { userId: chat.userId }],
        },
        data: {
          isNew: false,
        },
      });
    }
  });
  if (seller?.buyerId !== user?.id && seller?.sellerId !== user?.id) {
    res.json({ ok: false, error: "접근 권한이 없습니다." });
  } else {
    res.json({ ok: true, sellerChat, seller });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
