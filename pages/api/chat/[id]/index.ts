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
  const allChatMessages = await client.sellerChat.findMany({
    where: {
      chatRoomId: +id, // chatroom 은 seller 와 one to one 이다. 즉 seller 에 대해서 하나의 chatroom이 형성된다.
    },
    include: {
      user: {
        // chat message를 보내는 사람
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });
  //console.log("api.chat.[id].index---sellerChat: ", JSON.stringify(sellerChat, null, 2));
  // const newChatCount = allChatMessages.filter(chat => chat.isNew === true).length;

  const chatRoomOfSeller = await client.chatRoom.findUnique({
    where: {
      id: +id,
    },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      product: {
        select: {
          price: true,
          image: true,
          name: true,
          isReserved: true,
          isSold: true,
        }
      },
    },
  });
  // chatRoomOfSeller?.buyerId
  // chatRoomOfSeller?.sellerId
  // 가져온 상대방의 메세지 모두는 이미 읽은 것으로 결정한다.
  const yourId = user?.id === chatRoomOfSeller?.buyerId ? chatRoomOfSeller?.sellerId : chatRoomOfSeller?.buyerId 
  await client.sellerChat.updateMany({ // DB의 모든 chatMessage를 update함
    where: {
      AND: [{ chatRoomId: +id }, { userId: yourId }],
    },
    data: {
      isNew: false, // 상대방이 작성한 메세지를 내가 읽었으면 false로 만든다. 초기에는 true로 되어 있다. 
    },
  });
  if (chatRoomOfSeller?.buyerId !== user?.id && chatRoomOfSeller?.sellerId !== user?.id) {
    res.json({ ok: false, error: "접근 권한이 없습니다." });
  } else {
    res.json({ ok: true, sellerChat: allChatMessages, chatRoomOfSeller });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
