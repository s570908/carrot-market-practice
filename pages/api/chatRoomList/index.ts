import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "POST") {
    // consumer가 provider한테 product를 사고 싶을때 생성
    const {
      body: { buyerId, sellerId, productId },
    } = req;
    console.log("buyerId, sellerId, productId: ", buyerId, sellerId, productId);
    const chatRoom = await client.chatRoom.findFirst({
      where: {
        AND: [{ buyerId }, { sellerId }, { productId }],
      },
    });
    //console.log("chatRoom: ", chatRoom);
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
          product: {
            connect: {
              id: productId,
            },
          },
          recentMsgId: undefined, // `recentMsgId`를 명시적으로 null로 설정
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
      query: { key },
      session: { user },
    } = req;

    if (!key || typeof key !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Invalid or missing query parameter 'key'. Must be 'all', 'seller', or 'buyer'.",
      });
    }

    let whereCondition = {};

    if (key === "seller") {
      whereCondition = { sellerId: user?.id };
    } else if (key === "buyer") {
      whereCondition = { buyerId: user?.id };
    } else if (key === "all") {
      whereCondition = {
        OR: [{ sellerId: user?.id }, { buyerId: user?.id }],
      };
    } else {
      return res.status(400).json({
        ok: false,
        error: "'key' must be one of 'all', 'seller', or 'buyer'.",
      });
    }

    const sellerChatRoomList = await client.chatRoom.findMany({
      where: whereCondition,
      select: {
        id: true, // id만 선택
      },
    });

    res.json({
      ok: true,
      sellerChatRoomList: sellerChatRoomList.map((room) => room.id), // ID만 배열로 반환
    });
  }
}

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
