import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const {
      session: { user },
      query: { id }, // 쿼리에서 productId 추출
    } = req;
    if (!id) {
      return res.status(404).end({ error: "request query product Id is not given." });
    }
    if (!user) {
      return res.status(404).end({ error: "request user is not given." });
    }

    //console.log("==========req.query: ", req.query);
    //console.log("==============user, productId: ", user, productId);

    const productIdValue = parseInt(id as string, 10);
    const chatRoomListRelatedProduct = await client.chatRoom.findMany({
      // where: {
      //   AND: [
      //     { productId: productIdValue },
      //     {
      //        sellerId: user?.id ,
      //     },
      //   ],
      // },
      where: {
        productId: productIdValue,
      },
      include: {
        recentMsg: {
          select: {
            chatMsg: true,
            isNew: true,
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
            image: true,
            price: true,
            status: true,
          },
        },
        sellerChat: {
          select: {
            chatMsg: true,
            isNew: true,
            user: true,
          },
        },
      },
    });

    // 해당 product에 관련된 chat room 들 모두에서 로그인 user가 가장 마지막으로 읽은 메시지 id를 가져온다.
    // 그 메시지 이후의 메시지를 카운트한다. 이 카운트가 로그인 user가 아직 읽지 않은 메시지의 갯수가 된다.
    const userUnreadCounts = await Promise.all(
      chatRoomListRelatedProduct.map(async (chatRoom) => {
        const userLastRead = await client.lastReadMessage.findUnique({
          where: { userId_chatRoomId: { userId: user.id, chatRoomId: chatRoom.id } },
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

    // userUnreadCounts를 chatRoomListRelatedProduct에 병합
    const mergedChatRooms = chatRoomListRelatedProduct.map((chatRoom) => {
      // userUnreadCounts에서 해당 chatRoomId의 unreadCount를 찾기
      const unreadCount =
        userUnreadCounts.find((unread) => unread.chatRoomId === chatRoom.id)?.unreadCount || 0; // 기본값 0 설정

      // unreadCount를 추가한 새로운 객체 반환
      return {
        ...chatRoom,
        unreadCount,
      };
    });
    //console.log("mergedChatRooms: ", JSON.stringify(mergedChatRooms, null, 2));

    res.json({
      ok: true,
      chatRoomListWithUnreadCount: mergedChatRooms,
    });
  }

  if (req.method === "DELETE") {
    const {
      query: { id }, // 쿼리에서 productId 추출
    } = req;
    if (!id) {
      return res.status(404).end({ error: "request query id is not given." });
    }
    const delChatRoomList = await client.chatRoom.deleteMany({
      where: {
        id: +id,
      },
    });
    res.json({
      ok: true,
      delChatRoomList,
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "DELETE"], handler, isPrivate: true })
);
