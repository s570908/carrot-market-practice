import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 세션에서 사용자 ID를 추출
  const session = req.session;
  const userId = session.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, error: "Not authorized" });
  }

  if (req.method === "GET") {
    try {
      // 1. 로그인 유저가 속한 모든 채팅방 찾기
      const chatRooms = await client.chatRoom.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        select: {
          id: true,
        },
      });

      // 채팅방 ID 목록
      const chatRoomIds = chatRooms.map((room) => room.id);

      // 로그인 유저의 각 채팅방별 마지막으로 읽은 메시지 조회
      const lastReadMessages = await client.lastReadMessage.findMany({
        where: {
          userId: userId,
          chatRoomId: { in: chatRoomIds },
        },
        select: {
          chatRoomId: true,
          sellerChatId: true,
        },
      });

      // 채팅방별 마지막 읽은 메시지 ID 맵 생성
      const lastReadMap = new Map();
      lastReadMessages.forEach((item) => {
        lastReadMap.set(item.chatRoomId, item.sellerChatId);
      });

      // 하나라도 안 읽은 메시지가 있는지 확인
      let hasUnreadMessages = false;

      for (const chatRoomId of chatRoomIds) {
        const lastReadId = lastReadMap.get(chatRoomId) || 0;

        // 해당 채팅방에서 다른 사용자가 보낸 메시지 중 마지막으로 읽은 메시지 이후의 메시지가 있는지 확인
        const unreadMessage = await client.sellerChat.findFirst({
          where: {
            chatRoomId,
            userId: {
              not: userId,
            },
            id: {
              gt: lastReadId,
            },
          },
          select: {
            id: true,
          },
        });

        if (unreadMessage) {
          hasUnreadMessages = true;
          break; // 하나라도 안 읽은 메시지가 있으면 즉시 중단
        }
      }

      res.status(200).json({
        ok: true,
        hasUnreadMessages,
      });
    } catch (error) {
      console.error("Error checking unread messages:", error);
      res.status(500).json({ ok: false, error: "Failed to check unread messages" });
    }
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
