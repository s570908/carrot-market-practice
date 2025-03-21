import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { ApiResponseType } from "apiLibs/atypes";

interface ChatRoomParams {
  buyerId: number;
  sellerId: number;
  productId: number;
}

interface GetChatRoomParams {
  condition: any;
  user: any;
}

const findOrCreateChatRoom = async ({ buyerId, sellerId, productId }: ChatRoomParams) => {
  const chatRoom = await client.chatRoom.findFirst({
    where: {
      AND: [{ buyerId }, { sellerId }, { productId }],
    },
  });

  if (chatRoom) {
    return chatRoom;
  }

  const newChatRoom = await client.chatRoom.create({
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
    },
  });

  return newChatRoom;
};

const getChatRooms = async ({ condition, user }: GetChatRoomParams) => {
  const chatRooms = await client.chatRoom.findMany({
    where: condition,
    include: {
      recentMsg: {
        select: {
          chatMsg: true,
          //isNew: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
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
      product: {
        select: {
          id: true,
          userId: true,
          name: true,
          images: true,
          price: true,
          status: true,
        },
      },
      sellerChat: {
        select: {
          chatMsg: true,
          //isNew: true,
          user: true,
        },
      },
    },
  });

  const unreadCountsPerRoom: { [roomId: string]: number } = {};
  chatRooms.forEach((chatRoom) => {
    let unreadCount = 0;

    // if (chatRoom.sellerChat) {
    //   chatRoom.sellerChat.forEach((chat) => {
    //     if (chat.user !== user) {
    //       if (chat.isNew === true) {
    //         unreadCount++;
    //       }
    //     }
    //   });
    // }

    unreadCountsPerRoom[chatRoom.id] = unreadCount;
  });

  return { chatRooms, unreadCountsPerRoom };
};

const getChatRoomListForProduct = async (productIdValue: number) => {
  return await client.chatRoom.findMany({
    where: {
      productId: productIdValue,
    },
    include: {
      recentMsg: {
        select: {
          chatMsg: true,
          //isNew: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
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
      product: {
        select: {
          id: true,
          userId: true,
          name: true,
          images: true,
          price: true,
          status: true,
        },
      },
      sellerChat: {
        select: {
          chatMsg: true,
          //isNew: true,
          user: true,
        },
      },
    },
  });
};

const getUserUnreadCounts = async (chatRooms: any[], userId: number) => {
  return await Promise.all(
    chatRooms.map(async (chatRoom) => {
      const userLastRead = await client.lastReadMessage.findUnique({
        where: { userId_chatRoomId: { userId, chatRoomId: chatRoom.id } },
      });

      const unreadCount = await client.sellerChat.count({
        where: {
          chatRoomId: chatRoom.id,
          id: { gt: userLastRead?.sellerChatId || 0 }, // 마지막으로 읽은 메시지 이후의 메시지를 카운트한다.
        },
      });
      return {
        chatRoomId: chatRoom.id,
        unreadCount,
      };
    })
  );
};

const mergeChatRoomsWithUnreadCounts = (chatRooms: any[], userUnreadCounts: any[]) => {
  return chatRooms.map((chatRoom) => {
    const unreadCount =
      userUnreadCounts.find((unread) => unread.chatRoomId === chatRoom.id)?.unreadCount || 0; // 기본값 0 설정

    return {
      ...chatRoom,
      unreadCount,
    };
  });
};

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponseType>) {
  if (req.method === "POST") {
    // consumer(buyer)가 provider(seller)한테 product를 사고 싶을때 생성
    const { buyerId, sellerId, productId } = req.body;

    if (!buyerId || !sellerId || !productId) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    //console.log("buyerId, sellerId, productId: ", buyerId, sellerId, productId);
    try {
      const chatRoom = await findOrCreateChatRoom({
        buyerId: Number(buyerId),
        sellerId: Number(sellerId),
        productId: Number(productId),
      });
      res.json({ ok: true, chatRoom });
    } catch (error) {
      console.error("Failed to find or create chat room", error);
      res.status(500).json({ ok: false, error: "Internal server error" });
    }
  }
  if (req.method === "GET") {
    const {
      session: { user },
      query: { productId }, // 쿼리에서 productId 추출
    } = req;

    if (!user) {
      return res.status(404).end({ error: "request user is not given." });
    }
    try {
      if (productId) {
        const productIdValue = parseInt(productId as string, 10);
        const { chatRooms, unreadCountsPerRoom } = await getChatRooms({
          condition: { productId: productIdValue },
          user,
        });
        res.json({
          ok: true,
          chatRoomListRelatedProduct: chatRooms,
          unreadCountsPerRoom,
        });
      } else {
        console.log("productId is not given.");
        const { chatRooms, unreadCountsPerRoom } = await getChatRooms({
          condition: { OR: [{ buyerId: user?.id }, { sellerId: user?.id }] },
          user,
        });
        res.json({
          ok: true,
          chatRoomList: chatRooms,
          unreadCountsPerRoom,
        });
      }
    } catch (error) {
      console.error("Failed to get chat rooms", error);
      res.status(500).json({ ok: false, error: "Internal server error" });
    }
  }
  if (req.method === "DELETE") {
    const {
      query: { productId }, // 쿼리에서 productId 추출
    } = req;
    if (productId) {
      const delChatRoomList = await client.chatRoom.deleteMany({
        where: {
          id: +productId,
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
