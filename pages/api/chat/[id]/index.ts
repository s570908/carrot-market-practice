import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { MessageData, NextApiResponseServerIo } from "types/types";

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
    if (!user) {
      return res.status(404).end({ error: "request user is not given." });
    }
    const allChatMessages = await client.sellerChat.findMany({
      where: {
        chatRoomId: +id, // chatroom 은 buyer가 product에 대하여 생성한다. 즉, chatroom은 buyer와 product에 대하여 unique하다.
      },
      include: {
        user: {
          // chat message를 보내는 사람
          select: {
            name: true,
            avatar: true,
          },
        },
        // ChatMeetup 정보 포함
        chatMeetup: true,
      },
    });

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
            images: true, // images 속성 추가
            name: true,
            status: true,
          },
        },
      },
    });

    if (allChatMessages.length > 0) {
      const sellerChatId = allChatMessages[allChatMessages.length - 1].id;

      // 가져온 메세지 모두는 이것을 가져온 사용자가 이미 읽은 것으로 결정한다.
      // 가장 최근 메시지를 가장 마지막으로 읽은 메시지로 처리
      const result = await client.lastReadMessage.upsert({
        where: { userId_chatRoomId: { userId: user?.id, chatRoomId: +id } },
        create: { userId: user?.id, chatRoomId: +id, sellerChatId: sellerChatId },
        update: { sellerChatId: sellerChatId },
      });

      //const channel = `/ws-${worksapce}-${id}`;

      // res?.socket?.server?.io
      //   ?.of(`ws-${worksapce}`)
      //   .to(channel)
      //   .emit("chats-lastReadMessage", result);
      // console.log(
      //   "channel에 chats-lastReadMessage 이벤트를 보낸다: result.sellerChatId: ",
      //   result.sellerChatId
      // );
    }

    if (chatRoomOfSeller?.buyerId !== user?.id && chatRoomOfSeller?.sellerId !== user?.id) {
      res.json({ ok: false, error: "접근 권한이 없습니다." });
    } else {
      res.json({ ok: true, sellerChat: allChatMessages, chatRoomOfSeller });
    }
  }
  if (req.method === "POST") {
    const {
      query: { id },
      body,
      session: { user },
    } = req;
    if (!id) {
      return res.status(404).end({ error: "request query is not given." });
    }
    if (!user) {
      return res.status(404).end({ error: "request user is not given." });
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
        //isNew: true, //// 이 chat message는 상대방이 읽지 않았으므로 true, 추후 지운다.
      },
    });

    const message: MessageData = {
      id: sellerChat.id,
      chatMsg: sellerChat.chatMsg,
      user: { id: user?.id },
      createdAt: sellerChat.createdAt,
      chatRoomId: +id,
    };

    // const channel = `/ws-${worksapce}-${id}`;

    // // dispatch to channel "message"
    // //*******************************************중요!!!!
    // // Workspace를 사용하는 io일 경우에는 of(`ws-${worksapce}`) 이 부분이 매우 중요함. 반드시 사용해야함.
    // //****************************************************
    // res?.socket?.server?.io?.of(`ws-${worksapce}`).to(channel).emit("message", message);

    // Keep consistent with socket.ts format
    const namespaceName = `ws-${worksapce}`;
    const channel = `/${namespaceName}-${id}`;

    // dispatch to channel "message"
    //*******************************************중요!!!!
    // Workspace를 사용하는 io일 경우에는 of(`ws-${worksapce}`) 이 부분이 매우 중요함. 반드시 사용해야함.
    //****************************************************
    res?.socket?.server?.io?.of(namespaceName).to(channel).emit("message", message);
    console.log(
      "workspace.channel 로 message 이벤트를 전송하였다: ",
      namespaceName,
      channel,
      message.chatMsg
    );

    // 가장 최신 메시지 recentMsg를 서버에 보내야 한다.
    // 필요하지 않을 수도 있다. 추후 체크요망. 필요한 것 같다.
    // EachChatRoom.tsx에서...
    // message socket event를 받고, message.chatRoomId와 EachChatRoom의 chatRoom id 가 일치하면
    // client.chatRoom을 reftech하도록 만듣다. useQuery를 이용한다.
    const updatedChatRoom = await client.chatRoom.update({
      where: { id: +id },
      data: {
        recentMsg: {
          connect: { id: sellerChat.id },
        },
      },
    });

    res.json({ ok: true, sellerChat });
  }
}

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
