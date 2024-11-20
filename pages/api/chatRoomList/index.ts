import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
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

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
