import client from "@libs/client/client";
import { MessageType } from "@prisma/client";

export async function getChatRoomData(chatRoomId: number) {
  const chatRoomData = await client.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      buyer: true,
      seller: true,
      product: true,
    },
  });
  return chatRoomData;
}


