import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";
import { createAlarmSettings } from "@/apiLibs/chats";

const workspace = "market";

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
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
      const [message, chatMeetup] = await client.$transaction(
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
            },
            include: {
              chatRoom: true, // ✅ chatRoom만 include 가능
            },
          });

          const createdMyAlarmSetting = await createAlarmSettings({
            userId: user.id,
            chatId: chatRoomId,
            messageId: createdMessage.id,
            alarmTime,
            triggerAt: new Date(
              new Date(appointmentTime).getTime() - 30 * 60 * 1000
            ).toISOString(),
            disableAlarm: false,
          });

          const createdYourAlarmSetting = await createAlarmSettings({
            userId: yourId,
            chatId: chatRoomId,
            messageId: createdMessage.id,
            alarmTime,
            triggerAt: new Date(
              new Date(appointmentTime).getTime() - 30 * 60 * 1000
            ).toISOString(),
            disableAlarm: false,
          });

          return [
            createdMessage,
            createdChatMeetup,
            createdMyAlarmSetting,
            createdYourAlarmSetting,
          ];
        }
      );

      // 소켓으로 채팅 메시지 전송
      if (res?.socket?.server?.io) {
        try {
          const channel = `/ws-${workspace}-${chatRoomId}`;

          const socketMessage = {
            id: message.id,
            chatMsg: message.chatMsg,
            userId: user.id,
            chatRoomId: +chatRoomId,
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
            type: "appointment",
          };

          // 채팅 메시지로 전송
          res?.socket?.server?.io
            ?.of(`ws-${workspace}`)
            .to(channel)
            .emit("message", socketMessage);

          // 약속 생성 이벤트 (버튼 상태 동기화용) - 양쪽 채팅창에 전송
          res?.socket?.server?.io
            ?.of(`ws-${workspace}`)
            .to(channel)
            .emit("meetup:created", {
              chatRoomId: +chatRoomId,
              meetupId: chatMeetup.id,
            });

          console.log(
            `소켓 이벤트 전송함. Emitting appointment message and meetup:created to channel: ${channel}`
          );
        } catch (socketError) {
          console.error("소켓 이벤트 전송 실패:", socketError);
        }
      } else {
        console.warn(
          "소켓 서버가 초기화되지 않았습니다. 소켓 이벤트를 전송할 수 없습니다."
        );
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
        error: "약속 생성에 실패했습니다",
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
