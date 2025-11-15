import client from "@libs/client/client";
import { NextApiResponseServerIo } from "@/types/types";

interface CreateMeetupParams {
  appointmentTime: string;
  place: string;
  locationLatitude?: number;
  locationLongitude?: number;
  alarmTime?: string;
  chatRoomId: number;
  userId: number;
  messageText: string;
  messageType: "appointment" | "appointment_update";
}

export async function createChatMeetup(params: CreateMeetupParams) {
  const {
    appointmentTime,
    place,
    locationLatitude,
    locationLongitude,
    alarmTime,
    chatRoomId,
    userId,
    messageText,
    messageType,
  } = params;

  // 유효성 검사
  if (!appointmentTime || !place || !chatRoomId) {
    throw new Error(
      "필수 필드가 누락되었습니다 (appointmentTime, place, chatRoomId)"
    );
  }

  if (isNaN(new Date(appointmentTime).getTime())) {
    throw new Error("유효하지 않은 약속 시간 형식입니다");
  }

  // 트랜잭션으로 메시지와 약속 생성
  const [message, chatMeetup] = await client.$transaction(async (prisma) => {
    const createdMessage = await prisma.sellerChat.create({
      data: {
        chatMsg: messageText,
        user: { connect: { id: userId } },
        chatRoom: { connect: { id: chatRoomId } },
      },
    });

    const createdChatMeetup = await prisma.chatMeetup.create({
      data: {
        appointmentTime: new Date(appointmentTime),
        place,
        locationLatitude,
        locationLongitude,
        alarmTime,
        chatRoom: { connect: { id: chatRoomId } },
        user: { connect: { id: userId } },
      },
    });

    return [createdMessage, createdChatMeetup];
  });

  return { message, chatMeetup, messageType };
}

export function createSocketMessage(
  message: any,
  chatMeetup: any,
  userId: number,
  chatRoomId: number,
  messageType: "appointment" | "appointment_update"
) {
  return {
    id: message.id,
    chatMsg: message.chatMsg,
    userId,
    chatRoomId,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    chatMeetup: {
      id: chatMeetup.id,
      appointmentTime: chatMeetup.appointmentTime,
      place: chatMeetup.place,
      locationLatitude: chatMeetup.locationLatitude,
      locationLongitude: chatMeetup.locationLongitude,
      alarmTime: chatMeetup.alarmTime,
    },
    type: messageType,
  };
}

export async function emitSocketEvent(
  res: NextApiResponseServerIo,
  socketMessage: any,
  chatRoomId: number,
  workspace: string = "market"
) {
  if (res?.socket?.server?.io) {
    try {
      const channel = `/ws-${workspace}-${chatRoomId}`;
      res?.socket?.server?.io
        ?.of(`ws-${workspace}`)
        .to(channel)
        .emit("message", socketMessage);
      console.log(`Emitting message socket event to channel: ${channel}`);
    } catch (socketError) {
      console.error("소켓 이벤트 전송 실패:", socketError);
      throw socketError;
    }
  } else {
    console.log("Socket.io not initialized or not available");
  }
}
