import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";

const workspace = "market";

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method === "POST") {
    const {
      appointmentTime,
      place,
      locationLatitude,
      locationLongitude,
      alarmTime,
    } = req.body;
    const { user } = req.session;
    const chatRoomId = Number(req.query.id);

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    if (!appointmentTime || !place) {
      console.log("필수 필드 누락:", {
        appointmentTime,
        place,
        locationLatitude,
        locationLongitude,
        alarmTime,
      });
      return res.status(400).json({
        ok: false,
        error: "필수 필드가 누락되었습니다 (appointmentTime, place)",
      });
    }

    try {
      // 새로운 약속과 메시지 생성 (기존 약속은 수정하지 않음)
      const [newMessage, newMeetup] = await client.$transaction(
        async (prisma) => {
          const message = await prisma.sellerChat.create({
            data: {
              chatMsg: "약속을 변경했어요",
              user: { connect: { id: user.id } },
              chatRoom: { connect: { id: chatRoomId } },
            },
          });

          const meetup = await prisma.chatMeetup.create({
            data: {
              appointmentTime: new Date(appointmentTime),
              place,
              locationLatitude,
              locationLongitude,
              alarmTime,
              message: { connect: { id: message.id } },
            },
            include: { message: true },
          });

          return [message, meetup];
        }
      );

      // 소켓으로 새 약속 메시지 전송
      if (res?.socket?.server?.io) {
        try {
          const channel = `/ws-${workspace}-${chatRoomId}`;

          const socketMessage = {
            id: newMessage.id,
            chatMsg: newMessage.chatMsg,
            userId: user.id,
            chatRoomId,
            createdAt: newMessage.createdAt,
            updatedAt: newMessage.updatedAt,
            chatMeetup: {
              id: newMeetup.id,
              appointmentTime: newMeetup.appointmentTime,
              place: newMeetup.place,
              locationLatitude: newMeetup.locationLatitude,
              locationLongitude: newMeetup.locationLongitude,
              alarmTime: newMeetup.alarmTime,
            },
            type: "appointment_update",
          };

          // 채팅 메시지로 전송
          res?.socket?.server?.io
            ?.of(`ws-${workspace}`)
            .to(channel)
            .emit("message", socketMessage);

          // 약속 변경 이벤트 (버튼 상태 동기화용) - 양쪽 채팅창에 전송
          res?.socket?.server?.io
            ?.of(`ws-${workspace}`)
            .to(channel)
            .emit("meetup:updated", {
              chatRoomId,
              meetupId: newMeetup.id,
            });

          console.log(`Emitting meetup update to channel: ${channel}`);
        } catch (socketError) {
          console.error("소켓 이벤트 전송 실패:", socketError);
        }
      }

      return res.json({
        ok: true,
        chatMeetup: newMeetup,
        message: newMessage,
      });
    } catch (error) {
      console.error("Error creating new chat meetup:", error);
      return res.status(500).json({
        ok: false,
        error: "약속 생성에 실패했습니다",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default withApiSession(
  withHandler({ methods: ["POST"], handler, isPrivate: true })
);
