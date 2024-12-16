import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { NextApiResponseServerIo } from "types/types";

const worksapce = "market";

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method === "GET") {
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
            writtenReviews: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            writtenReviews: true,
          },
        },
        product: {
          select: {
            price: true,
            image: true,
            name: true,
            status: true,
          },
        },
      },
    });
    // chatRoomOfSeller?.buyerId
    // chatRoomOfSeller?.sellerId
    // 가져온 상대방의 메세지 모두는 이미 읽은 것으로 결정한다.
    const yourId =
      user?.id === chatRoomOfSeller?.buyerId
        ? chatRoomOfSeller?.sellerId
        : chatRoomOfSeller?.buyerId;
    await client.sellerChat.updateMany({
      // DB의 모든 chatMessage를 update함
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
  if (req.method === "POST") {
    //async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
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
        chatRoom: {
          connect: {
            id: +id,
          },
        },
        // chat message를 만드는 사람은 항상 로그인 user다.
        user: {
          connect: {
            id: user?.id,
          },
        },
        isNew: true, // 이 chat message는 상대방이 읽지 않았으므로 true
      },
    });

    // if (res?.socket?.server?.io) {
    //   console.log("test");
    //   const room = `chatRoom-${id}`; // Define the room name
    //   res.socket.server.io.emit("message", {
    //     id: sellerChat.id,
    //     chatMsg: sellerChat.chatMsg,
    //     user: { id: user?.id },
    //     createdAt: sellerChat.createdAt,
    //   });
    // } else {
    //   console.error("Socket.IO server not initialized");
    // }

    const message = {
      id: sellerChat.id,
      chatMsg: sellerChat.chatMsg,
      user: { id: user?.id },
      createdAt: sellerChat.createdAt,
    };

    const channel = `/ws-${worksapce}-${id}`;

    // dispatch to channel "message"
    //*******************************************중요!!!!
    // Workspace를 사용하는 io일 경우에는 of(`ws-${worksapce}`) 이 부분이 매우 중요함. 반드시 사용해야함.
    //****************************************************
    res?.socket?.server?.io?.of(`ws-${worksapce}`).to(channel).emit("message", message);

    // recentMsg를 서버에 보내야 한다.
    const updatedChatRoom = await client.chatRoom.update({
      where: { id: +id },
      data: {
        recentMsg: {
          connect: { id: sellerChat.id },
        },
      },
    });

    res?.socket?.server?.io?.of(`ws-${worksapce}`).to(channel).emit("chats", updatedChatRoom);
    console.log("Check if you listened chats event");

    // await client.sellerChat.updateMany({
    //   where: {
    //     AND: [
    //       { chatRoomId: +id }, // 해당 채팅방에 속한
    //       { createdAt: { lt: sellerChat.createdAt } }, // 현재 시간 이전에 생성된
    //       { isNew: true }, // isNew가 true인
    //     ],
    //   },
    //   data: {
    //     isNew: false, // isNew를 false로 설정하여 읽음 상태로 표시
    //   },
    // });

    res.json({ ok: true, sellerChat });
  }
}

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
