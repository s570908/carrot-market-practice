import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    session: { user },
  } = req;

  if (!user) {
    return res.status(404).end({ error: "request user is not given." });
  }

  // Parse `productId` or `id` from the file path
  const { slug } = req.query; // Assume "slug" holds path segments
  const [type, value] = slug as string[];
  // 	/api/chatRooms/product/123 -> ["product", "123"]
  // 	/api/chatRooms/id/456 -> ["id", "456"]

  if (!type || !value) {
    return res.status(400).json({
      error: "Invalid request. Path must include type and value.",
      ok: false,
    });
  }

  if (req.method === "GET") {
    if (type === "product") {
      //console.log("/api/chatRoomList/product/${queryId}---type, value: ", type, value);
      // Handle multiple chat rooms for a product
      const chatRoomList = await client.chatRoom.findMany({
        where: { productId: parseInt(value, 10) },
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
            // include: {
            //   images: true, // Include images relationship
            // },
            select: {
              id: true,
              userId: true,
              name: true,
              price: true,
              status: true,
              images: true, // Corrected field name
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

      // 예
      // userUnreadCounts = [
      // 	{ chatRoomId: 1, unreadCount: 3 }, // 채팅방 1에 3개의 읽지 않은 메시지
      // 	{ chatRoomId: 2, unreadCount: 2 }, // 채팅방 2에 2개의 읽지 않은 메시지
      // 	{ chatRoomId: 3, unreadCount: 5 }, // 채팅방 3에 5개의 읽지 않은 메시지
      // ];

      // 해당 product에 관련된 chat room 들 모두에서 로그인 user가 가장 마지막으로 읽은 메시지 id를 가져온다.
      // 그 메시지 이후의 메시지를 카운트한다. 이 카운트가 로그인 user가 아직 읽지 않은 메시지의 갯수가 된다.
      const userUnreadCounts = await Promise.all(
        chatRoomList.map(async (chatRoom) => {
          const userLastRead = await client.lastReadMessage.findUnique({
            where: { userId_chatRoomId: { userId: user.id, chatRoomId: chatRoom.id } },
          });

          const unreadCount = await client.sellerChat.count({
            where: {
              chatRoomId: chatRoom.id,
              id: { gt: userLastRead?.sellerChatId || 0 },
            },
          });
          return {
            chatRoomId: chatRoom.id,
            unreadCount,
          };
        })
      );

      // userUnreadCounts를 chatRoomList에 병합
      const mergedChatRooms = chatRoomList.map((chatRoom) => {
        // userUnreadCounts에서 해당 chatRoomId의 unreadCount를 찾기
        const unreadCount =
          userUnreadCounts.find((unread) => unread.chatRoomId === chatRoom.id)?.unreadCount || 0;

        // unreadCount를 추가한 새로운 객체 반환
        return {
          ...chatRoom,
          unreadCount,
        };
      });

      console.log("mergedChatRooms.length: ", mergedChatRooms.length);

      return res.json({
        ok: true,
        chatRoomListWithUnreadCount: mergedChatRooms,
      });
    } else if (type === "id") {
      // Handle a single chat room by id
      const chatRoom = await client.chatRoom.findUnique({
        where: { id: parseInt(value, 10) },
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
              images: true, // Corrected field name
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

      if (!chatRoom) {
        return res.status(404).json({
          error: "Chat room not found.",
          ok: false,
        });
      }

      const userLastRead = await client.lastReadMessage.findUnique({
        where: { userId_chatRoomId: { userId: user.id, chatRoomId: chatRoom.id } },
      });

      const unreadCount = await client.sellerChat.count({
        where: {
          chatRoomId: chatRoom.id,
          id: { gt: userLastRead?.sellerChatId || 0 },
        },
      });

      return res.json({
        ok: true,
        chatRoom: {
          ...chatRoom,
          unreadCount,
        },
      });
    } else {
      return res.status(400).json({
        error: "Invalid path type. Must be 'product' or 'id'.",
        ok: false,
      });
    }
  }

  if (req.method === "DELETE") {
    const whereClause =
      type === "product"
        ? { productId: parseInt(value, 10) }
        : type === "id"
        ? { id: parseInt(value, 10) }
        : null;

    if (!whereClause) {
      return res.status(400).json({
        error: "Invalid path type. Must be 'product' or 'id'.",
        ok: false,
      });
    }

    const delChatRoomList = await client.chatRoom.deleteMany({
      where: whereClause,
    });

    return res.json({
      ok: true,
      delChatRoomList,
    });
  }

  return res.status(405).json({
    error: "Method not allowed.",
    ok: false,
  });
}

export default withApiSession(
  withHandler({
    methods: ["GET", "DELETE"],
    handler,
    isPrivate: true,
  })
);
