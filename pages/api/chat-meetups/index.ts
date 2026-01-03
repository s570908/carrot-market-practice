import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";
import { createAlarmSettings } from "@/apiLibs/chats";
import { AlarmStatus } from "@prisma/client";

const workspace = "market";

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  // 차후 api는 pages\api\chat-meetups\[chatRoomId]\index.ts로 이전해야된다.
  if (req.method === "POST") {
    const {
      yourId,
      appointmentTime,
      place,
      locationLatitude,
      locationLongitude,
      alarmTime,
      chatRoomId,
    } = req.body;
    const { user } = req.session;
    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    if (!appointmentTime || !place || !chatRoomId) {
      return res.status(400).json({
        ok: false,
        error:
          "필수 필드가 누락되었습니다 (appointmentTime, place, chatRoomId)",
      });
    }

    try {
      // 트랜잭션으로 메시지와 약속 생성
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

          return [createdMessage, createdChatMeetup, createdMyAlarmSetting];
        }
      );

      return res.json({
        ok: true,
        chatMeetup,
        message,
        alarmSetting,
      });
    } catch (error) {
      console.error("Error creating chat meetup:", error);
      return res.status(500).json({
        ok: false,
        error: "약속 생성에 실패했습니다",
      });
    }
  }

  if (req.method === "PATCH") {
    // PATCH /api/chat-meetups?chatRoomId=...
    const {
      chatRoomId,
      appointmentTime,
      place,
      locationLatitude,
      locationLongitude,
      // alarmTime,
    } = req.body;

    if (!chatRoomId) {
      return res
        .status(400)
        .json({ ok: false, error: "chatRoomId is required" });
    }

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
      // if (alarmTime !== undefined) updateData.alarmTime = alarmTime;

      const updatedMeetup = await client.chatMeetup.update({
        where: { id: existingMeetup.id },
        data: updateData,
      });

      return res.status(200).json({ ok: true, chatMeetup: updatedMeetup });
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
  withHandler({
    methods: ["POST", "PATCH"],
    handler,
    isPrivate: true,
  })
);
