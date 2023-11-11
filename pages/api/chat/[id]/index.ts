import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id }, // chatroom id
    session: { user }, // login user
  } = req;
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const sellerChat = await client.sellerChat.findMany({
    where: {
      chatRoomId: +id, // chatroom 은 seller 와 one to one 이다. 즉 seller 에 대해서 하나의 chatroom이 형성된다.
    },
    include: {
      user: {
        // chat을 보내는 사람, 즉 buyer이다.
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });
  //console.log("api.chat.[id].index---sellerChat: ", JSON.stringify(sellerChat, null, 2));
  const chatRoomOfSeller = await client.chatRoom.findUnique({
    where: {
      id: +id,
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
          AND: [{ chatRoomId: +id }, { userId: chat.userId }],
        },
        data: {
          isNew: false,
        },
      });
    }
  });
  if (chatRoomOfSeller?.buyerId !== user?.id && chatRoomOfSeller?.sellerId !== user?.id) {
    res.json({ ok: false, error: "접근 권한이 없습니다." });
  } else {
    res.json({ ok: true, sellerChat, chatRoomOfSeller });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
