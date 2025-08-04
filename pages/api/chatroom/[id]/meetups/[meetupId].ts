import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";

const workspace = "market";

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  const chatRoomId = Number(req.query.id);
  const meetupId = Number(req.query.meetupId);
  const { user } = req.session;

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  if (req.method === "POST") {
    const { appointmentTime, place, locationLatitude, locationLongitude, alarmTime } = req.body;

    if (!appointmentTime || !place) {
      return res.status(400).json({ ok: false, error: "필수 필드 누락" });
    }

    try {
      const [message, chatMeetup] = await client.$transaction(async (prisma) => {
        const message = await prisma.sellerChat.create({
          data: {
            chatMsg: "약속을 변경했어요",
            user: { connect: { id: user.id } },
            chatRoom: { connect: { id: chatRoomId } },
          }
        });

        const meetup = await prisma.chatMeetup.create({
          data: {
            appointmentTime: new Date(appointmentTime),
            place,
            locationLatitude,
            locationLongitude,
            alarmTime,
            message: { connect: { id: message.id } }
          },
          include: { message: true }
        });

        return [message, meetup];
      });

      if (res?.socket?.server?.io) {
        const channel = `/ws-${workspace}-${chatRoomId}`;
        const socketMessage = {
          id: message.id,
          chatMsg: message.chatMsg,
          userId: user.id,
          chatRoomId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          chatMeetup,
          type: "appointment_update"
        };

        res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("message", socketMessage);
        // res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("meetup:updated", { 
        //   chatRoomId,
        //   meetupId: chatMeetup.id 
        // });
      }

      return res.json({ ok: true, chatMeetup, message });
    } catch (error) {
      console.error("Error updating meetup:", error);
      return res.status(500).json({ ok: false, error: "약속 수정 실패" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const meetup = await client.chatMeetup.delete({
        where: { id: meetupId }
      });

      if (res?.socket?.server?.io) {
        const channel = `/ws-${workspace}-${chatRoomId}`;
        res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("meetup:deleted", { 
          chatRoomId,
          meetupId 
        });
      }

      return res.json({ ok: true, meetup });
    } catch (error) {
      console.error("Error deleting meetup:", error);
      return res.status(500).json({ ok: false, error: "약속 삭제 실패" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default withApiSession(
  withHandler({ methods: ["POST", "DELETE"], handler, isPrivate: true })
);
