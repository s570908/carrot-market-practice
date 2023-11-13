import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "POST") {
    const {
      body: { buyerId, sellerId },
    } = req;
    const chatRoom = await client.chatRoom.findFirst({
      where: {
        AND: [{ buyerId }, { sellerId }],
      },
    });
    if (chatRoom) {
      res.json({
        ok: true,
        chatRoom,
      });
    } else {
      const createChatRoom = await client.chatRoom.create({
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
        createChatRoom,
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
            id: true,
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
      const delChatRoomList = await client.chatRoom.deleteMany({
        where: {
          id: +roomId,
        },
      });
      res.json({
        ok: true,
        delChatRoomList,
      });
    } else {
      res.json({
        ok: false,
        error: "no chatRoom of roomId found",
      });
    }
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
