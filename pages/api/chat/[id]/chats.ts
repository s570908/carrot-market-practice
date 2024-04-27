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
  
  // recentMsg를 서버에 보내야 한다.
  const updatedChatRoom = await client.chatRoom.update({
    where: { id: +id },
    data: {
      recentMsg: {
        connect: { id: sellerChat.id },
      },
    },
  });

  await client.sellerChat.updateMany({
    where: {
      AND: [
        { chatRoomId: +id }, // 해당 채팅방에 속한
        { createdAt: { lt: sellerChat.createdAt } }, // 현재 시간 이전에 생성된
        { isNew: true }, // isNew가 true인
      ],
    },
    data: {
      isNew: false, // isNew를 false로 설정하여 읽음 상태로 표시
    },
  });

  res.json({ ok: true, sellerChat });
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
