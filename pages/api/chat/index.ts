import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "POST") {
    const {
      body: { buyerId, sellerId },
    } = req;
    const chatRoomList = await client.chatRoom.findFirst({
      where: {
        AND: [{ buyerId }, { sellerId }],
      },
    });
    if (chatRoomList) {
      res.json({
        ok: true,
        chatRoomList,
      });
    } else {
      const createChat = await client.chatRoom.create({
        data: {
          buyer: {
            connect: {
              id: buyerId,
            },
          },
          seller: {
            connect: {
              id: sellerId,
            },
          },
        },
      });
      res.json({
        ok: true,
        createChat,
      });
    }
  }
  if (req.method === "GET") {
    const {
      session: { user },
    } = req;
    const chatRoomList = await client.chatRoom.findMany({
      where: {
        OR: [{ buyerId: user?.id }, { sellerId: user?.id }],
      },
      include: {
        recentMsg: {
          select: {
            chatMsg: true,
            isNew: true,
            userId: true,
          },
        },
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
    res.json({
      ok: true,
      chatRoomList,
    });
  }
  if (req.method === "DELETE") {
    const {
      query: { roomId },
    } = req;
    if (!roomId) {
      return res.status(404).end({ error: "request query is not given." });
    }
    if (roomId) {
      const delChatRoom = await client.chatRoom.deleteMany({
        where: {
          id: +roomId,
        },
      });
      res.json({
        ok: true,
        delChatRoom,
      });
    } else {
      res.json({
        ok: false,
        error: "no roomId found",
      });
    }
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
