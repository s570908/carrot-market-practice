import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";
import { AlarmStatus } from "@prisma/client";

const workspace = "market";

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  const { user } = req.session;
  const chatRoomId = Number(req.query.chatRoomId);

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  if (!chatRoomId) {
    return res.status(400).json({ ok: false, error: "chatRoomId is required" });
  }

  // GET: chatRoomId로 chatMeetup 조회
  if (req.method === "GET") {
    try {
      const chatMeetup = await client.chatMeetup.findUnique({
        where: { chatRoomId: chatRoomId },
      });

      if (!chatMeetup) {
        return res
          .status(404)
          .json({ ok: false, error: "ChatMeetup not found" });
      }

      return res.status(200).json({ ok: true, chatMeetup });
    } catch (error) {
      console.error("Error fetching chat meetup:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to fetch chat meetup" });
    }
  }

  if (req.method === "POST") {
    const {
      appointmentTime,
      place,
      locationLatitude,
      locationLongitude,
      alarmTime,
    } = req.body;

    if (!appointmentTime || !place) {
      return res.status(400).json({
        ok: false,
        error: "필수 필드가 누락되었습니다 (appointmentTime, place)",
      });
    }

    try {
      // 새로운 약속과 메시지 생성 (기존 약속은 수정하지 않음)
      const [message, chatMeetup, alarmSetting] = await client.$transaction(
        async (prisma) => {
          const createdMessage = await prisma.sellerChat.create({
            data: {
              chatMsg: "약속을 만들었어요",
              user: { connect: { id: user.id } },
              chatRoom: { connect: { id: +chatRoomId } },
            },
          });

          // ChatMeetup 생성 예시 (수정)
          const createdChatMeetup = await prisma.chatMeetup.create({
            data: {
              appointmentTime: new Date(appointmentTime),
              place,
              locationLatitude,
              locationLongitude,
              alarmTime,
              chatRoom: { connect: { id: chatRoomId } }, // ✅ ChatRoom과 연결
              user: { connect: { id: user.id } }, // 생성자(주최자) 연결
            },
            include: {
              chatRoom: true, // ✅ chatRoom만 include 가능
            },
          });

          // const createdMyAlarmSetting = await createAlarmSettings({
          //   userId: user.id,
          //   chatId: chatRoomId,
          //   // messageId: createdMessage.id,
          //   alarmTime,
          //   triggerAt: new Date(
          //     new Date(appointmentTime).getTime() - 30 * 60 * 1000
          //   ).toISOString(),
          //   disableAlarm: false,
          // });

          const createdMyAlarmSetting = await prisma.alarmSetting.create({
            data: {
              userId: user.id,
              chatRoomId: chatRoomId,
              alarmTime,
              triggerAt: new Date(
                new Date(appointmentTime).getTime() - 30 * 60 * 1000
              ).toISOString(),
              status: AlarmStatus.SCHEDULED,
            },
          });

          // const createdYourAlarmSetting = await createAlarmSettings({
          //   userId: yourId,
          //   chatId: chatRoomId,
          //   messageId: createdMessage.id,
          //   alarmTime,
          //   triggerAt: new Date(
          //     new Date(appointmentTime).getTime() - 30 * 60 * 1000
          //   ).toISOString(),
          //   disableAlarm: false,
          // });

          return [
            createdMessage,
            createdChatMeetup,
            createdMyAlarmSetting,
            // createdYourAlarmSetting,
          ];
        }
      );

      // 소켓으로 새 약속 메시지 전송
      // if (res?.socket?.server?.io) {
      //   try {
      //     const channel = `/ws-${workspace}-${chatRoomId}`;

      //     const socketMessage = {
      //       id: newMessage.id,
      //       chatMsg: newMessage.chatMsg,
      //       userId: user.id,
      //       chatRoomId,
      //       createdAt: newMessage.createdAt,
      //       updatedAt: newMessage.updatedAt,
      //       chatMeetup: {
      //         id: newMeetup.id,
      //         appointmentTime: newMeetup.appointmentTime,
      //         place: newMeetup.place,
      //         locationLatitude: newMeetup.locationLatitude,
      //         locationLongitude: newMeetup.locationLongitude,
      //         alarmTime: newMeetup.alarmTime,
      //       },
      //       type: "appointment_update",
      //     };

      //     // 채팅 메시지로 전송
      //     res?.socket?.server?.io
      //       ?.of(`ws-${workspace}`)
      //       .to(channel)
      //       .emit("message", socketMessage);

      //     // 약속 변경 이벤트 (버튼 상태 동기화용) - 양쪽 채팅창에 전송
      //     res?.socket?.server?.io
      //       ?.of(`ws-${workspace}`)
      //       .to(channel)
      //       .emit("meetup:updated", {
      //         chatRoomId,
      //         meetupId: newMeetup.id,
      //       });

      //     console.log(`Emitting meetup update to channel: ${channel}`);
      //   } catch (socketError) {
      //     console.error("소켓 이벤트 전송 실패:", socketError);
      //   }
      // }

      return res.json({
        ok: true,
        chatMeetup,
        message,
        alarmSetting,
      });
    } catch (error) {
      console.error("Error creating new chat meetup:", error);
      return res.status(500).json({
        ok: false,
        error: "약속 생성에 실패했습니다",
      });
    }
  }

  if (req.method === "PATCH") {
    // PATCH /api/chat-meetups?chatRoomId=...
    const {
      appointmentTime,
      place,
      locationLatitude,
      locationLongitude,
      alarmTime,
    } = req.body;

    try {
      // 기존 chatMeetup 찾기 (chatRoomId로 1:1 관계)
      const existingMeetup = await client.chatMeetup.findUnique({
        where: { chatRoomId: Number(chatRoomId) },
      });

      if (!existingMeetup) {
        return res
          .status(404)
          .json({ ok: false, error: "ChatMeetup not found" });
      }

      // 업데이트할 데이터 준비
      const updateData: any = {};
      if (appointmentTime !== undefined)
        updateData.appointmentTime = new Date(appointmentTime);
      if (place !== undefined) updateData.place = place;
      if (locationLatitude !== undefined)
        updateData.locationLatitude = locationLatitude;
      if (locationLongitude !== undefined)
        updateData.locationLongitude = locationLongitude;
      if (alarmTime !== undefined) updateData.alarmTime = alarmTime;

      const updatedMeetup = await client.chatMeetup.update({
        where: { id: existingMeetup.id },
        data: updateData,
      });

      const updatedMessage = await client.sellerChat.create({
        data: {
          chatMsg: "약속을 변경했습니다.",
          user: { connect: { id: user?.id } },
          chatRoom: { connect: { id: +chatRoomId } },
        },
      });

      return res
        .status(200)
        .json({ ok: true, chatMeetup: updatedMeetup, message: updatedMessage });
    } catch (error) {
      console.error("Error updating chat meetup:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update chat meetup" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default withApiSession(
  withHandler({ methods: ["POST", "PATCH", "GET"], handler, isPrivate: true })
);
