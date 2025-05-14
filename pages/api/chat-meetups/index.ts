import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";

const worksapce = "market";

async function handler(
  req: NextApiRequest, res: NextApiResponseServerIo
) {
  if (req.method === "POST") {
    // Add logging to match client-side function
    console.log("API received params:", req.body);
    
    // Updated to use flattened location properties
    const {
      body: { appointmentTime, place, locationLatitude, locationLongitude, alertTime, chatRoomId },
      session: { user },
    } = req;

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    // Updated validation
    if (!appointmentTime || !place || !chatRoomId) {
      return res.status(400).json({ 
        ok: false, 
        error: "필수 필드가 누락되었습니다 (appointmentTime, place, chatRoomId)" 
      });
    }

      const channel = `/ws-${worksapce}-${chatRoomId}`;

    try {
      // 트랜잭션으로 두 작업을 묶어서 처리
      const [message, chatMeetup] = await client.$transaction(async (prisma) => {
        // 1. 메시지 생성
        const message = await prisma.sellerChat.create({
          data: {
            chatMsg: "약속을 만들었어요",
            user: {
              connect: {
                id: user.id,
              },
            },
            chatRoom: {
              connect: {
                id: +chatRoomId,
              },
            },
          },
        });

        // 2. 약속 생성 및 메시지와 연결 - Using direct location properties
        const chatMeetup = await prisma.chatMeetup.create({
          data: {
            appointmentTime: new Date(appointmentTime),
            place,
            locationLatitude,
            locationLongitude,
            alertTime,
            message: {
              connect: {
                id: message.id,
              },
            },
          },
        });

        return [message, chatMeetup];
      });

      // Emit socket event after successful creation
      if (res?.socket?.server?.io) {
        console.log(`Emitting socket event to channel: ${channel}`);
        
        // Create a formatted message object for socket emission
        const socketMessage = {
          id: message.id,
          chatMsg: message.chatMsg,
          userId: user.id,
          chatRoomId: +chatRoomId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          appointment: {
            id: chatMeetup.id,
            appointmentTime: chatMeetup.appointmentTime,
            place: chatMeetup.place,
            locationLatitude: chatMeetup.locationLatitude,
            locationLongitude: chatMeetup.locationLongitude,
            alertTime: chatMeetup.alertTime
          },
          type: "appointment" // Add a type to differentiate from regular messages
        };

        // Emit to the appropriate channel using the same pattern as your chat messages
        res?.socket?.server?.io?.of(`ws-${worksapce}`).to(channel).emit("message", socketMessage);
      } else {
        console.log("Socket.io not initialized or not available");
      }

      return res.json({
        ok: true,
        chatMeetup,
        message,
      });
    } catch (error) {
      console.error("Error creating chat meetup:", error);
      return res.status(500).json({
        ok: false,
        error: "Failed to create chat meetup",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default withApiSession(
  withHandler({
    methods: ["POST"],
    handler,
    isPrivate: true,
  })
);
