import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>
) {
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
    console.log("chatRoom: ", chatRoom);
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
      session: { user },
      query: { productId }, // 쿼리에서 productId 추출
    } = req;

    console.log("==========req.query: ", req.query);
    console.log("==============user, productId: ", user, productId);

    if (productId) {
      const productIdValue = parseInt(productId as string, 10);
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
      const unreadCountsPerRoom: { [roomId: string]: number } = {};
      chatRoomListRelatedProduct.forEach((chatRoom) => {
        let unreadCount = 0;

        if (chatRoom.sellerChat) {
          chatRoom.sellerChat.forEach((chat) => {
            if (chat.user !== user) {
              if (chat.isNew === true) {
                unreadCount++;
              }
            }
          });
        }

        unreadCountsPerRoom[chatRoom.id] = unreadCount;
      });
      res.json({
        ok: true,
        chatRoomListRelatedProduct,
        unreadCountsPerRoom,
      });
    }
    // productId가 배열인 경우 첫 번째 요소 사용, 문자열인 경우 그대로 사용
    // const productIdValue = productId === undefined ? undefined : Array.isArray(productId) ? productId[0] : productId;
    // console.log("============productId: ", productId);
    // productIdValue !== undefined
    //   ? (condition = {
    //       AND: [
    //         {
    //           OR: [{ buyerId: user?.id }, { sellerId: user?.id }],
    //         },
    //         { productId: parseInt(productIdValue, 10) }, // productId가 있을 경우만 조건에 포함
    //       ],
    //     })
    //   : (condition = {
    //       OR: [{ buyerId: user?.id }, { sellerId: user?.id }],
    //     });
    else {
      let condition;
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
            },
          },
        },
      });
      const unreadCountsPerRoom: { [roomId: string]: number } = {};
      chatRoomList.forEach((chatRoom) => {
        let unreadCount = 0;

        if (chatRoom.sellerChat) {
          chatRoom.sellerChat.forEach((chat) => {
            if (chat.isNew === true) {
              unreadCount++;
            }
          });
        }

        unreadCountsPerRoom[chatRoom.id] = unreadCount;
      });
      console.log(
        "==================unreadCountsPerRoom: ",
        JSON.stringify(unreadCountsPerRoom, null, 2)
      );
      res.json({
        ok: true,
        chatRoomList,
        unreadCountsPerRoom,
      });
    }
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
