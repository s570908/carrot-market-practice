// libs/server/chatUtils.ts
import client from "@libs/client/client"

export async function getChatRoomData(chatRoomId: number) {
  const chatRoomData = await client.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      buyer: true,
      seller: true,
      product: true,
    //   chats: {
    //     include: {
    //       user: true,
    //     },
    //   },
    },
  });
  return chatRoomData;
}
