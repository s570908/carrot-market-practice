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
        // 약속이 없는 경우 200 OK와 함께 ok: false, exists: false, chatMeetup: null 반환
        return res
          .status(200)
          .json({ ok: false, exists: false, chatMeetup: null });
      }

      return res.status(200).json({ ok: true, exists: true, chatMeetup });
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
      // 약속 생성, alarmTime이 null이 아니면 alarmSetting도 생성
      const [message, chatMeetup, alarmSetting] = await client.$transaction(
        async (prisma) => {
          const createdChatMeetup = await prisma.chatMeetup.create({
            data: {
              appointmentTime: new Date(appointmentTime),
              place,
              locationLatitude,
              locationLongitude,
              alarmTime,
              chatRoom: { connect: { id: chatRoomId } },
              user: { connect: { id: user.id } },
            },
            include: {
              chatRoom: true,
            },
          });

          const createdMessage = await prisma.sellerChat.create({
            data: {
              chatMsg: "약속을 만들었어요",
              user: { connect: { id: user.id } },
              chatRoom: { connect: { id: +chatRoomId } },
              messageType: "USER",
              meta: JSON.stringify({
                type: "appointment",
                chatMeetupId: createdChatMeetup.id,
                appointmentTime: createdChatMeetup.appointmentTime,
                place: createdChatMeetup.place,
                locationLatitude: createdChatMeetup.locationLatitude,
                locationLongitude: createdChatMeetup.locationLongitude,
                alarmTime: createdChatMeetup.alarmTime,
              }),
            },
          });

          let createdMyAlarmSetting = null;
          if (alarmTime !== null && alarmTime !== undefined) {
            createdMyAlarmSetting = await prisma.alarmSetting.create({
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
          }

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
      console.error("Error creating new chat meetup:", error);
      return res.status(500).json({
        ok: false,
        error: "약속 생성에 실패했습니다",
      });
    }
  }

  if (req.method === "PATCH") {
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
      if ("alarmTime" in req.body) updateData.alarmTime = alarmTime;

      // Prisma transaction으로 약속 업데이트와 메시지 생성을 동시에 처리
      const [updatedMeetup, updatedMessage] = await client.$transaction(
        async (prisma) => {
          const updatedMeetup = await prisma.chatMeetup.update({
            where: { id: existingMeetup.id },
            data: updateData,
          });

          const updatedMessage = await prisma.sellerChat.create({
            data: {
              chatMsg: "약속을 변경했습니다.",
              user: { connect: { id: user?.id } },
              chatRoom: { connect: { id: +chatRoomId } },
              messageType: "USER",
              meta: JSON.stringify({
                type: "appointment",
                chatMeetupId: updatedMeetup.id,
                appointmentTime: updatedMeetup.appointmentTime,
                place: updatedMeetup.place,
                locationLatitude: updatedMeetup.locationLatitude,
                locationLongitude: updatedMeetup.locationLongitude,
                alarmTime: updatedMeetup.alarmTime,
              }),
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          });

          // --- alarmSetting의 triggerAt도 업데이트 ---
          // appointmentTime이 변경되었거나 alarmTime이 설정되어 있으면 triggerAt을 새로 계산
          let updatedAlarmSetting = null;
          if (updatedMeetup.alarmTime) {
            const alarmSetting = await prisma.alarmSetting.findFirst({
              where: {
                chatRoomId: chatRoomId,
                userId: user.id,
                status: AlarmStatus.SCHEDULED,
              },
            });

            if (alarmSetting) {
              function calculateTriggerTime(
                appointmentTime: Date,
                alarmTime: string
              ) {
                const triggerTime = new Date(appointmentTime);
                switch (alarmTime) {
                  case "10분 전":
                    triggerTime.setMinutes(triggerTime.getMinutes() - 10);
                    break;
                  case "30분 전":
                    triggerTime.setMinutes(triggerTime.getMinutes() - 30);
                    break;
                  case "1시간 전":
                    triggerTime.setHours(triggerTime.getHours() - 1);
                    break;
                  case "1일 전":
                    triggerTime.setDate(triggerTime.getDate() - 1);
                    break;
                }
                return triggerTime;
              }

              const newTriggerAt = calculateTriggerTime(
                updatedMeetup.appointmentTime,
                updatedMeetup.alarmTime
              );

              updatedAlarmSetting = await prisma.alarmSetting.update({
                where: { id: alarmSetting.id },
                data: {
                  alarmTime: updatedMeetup.alarmTime,
                  triggerAt: newTriggerAt.toISOString(),
                },
              });
            }
          }
          return [updatedMeetup, updatedMessage, updatedAlarmSetting];
        }
      );

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

  // 약속(chatMeetup) 삭제
  if (req.method === "DELETE") {
    try {
      // chatRoomId로 chatMeetup 찾기
      const existingMeetup = await client.chatMeetup.findUnique({
        where: { chatRoomId: Number(chatRoomId) },
      });

      if (!existingMeetup) {
        return res
          .status(404)
          .json({ ok: false, error: "ChatMeetup not found" });
      }

      // chatMeetup 삭제
      await client.chatMeetup.delete({
        where: { id: existingMeetup.id },
      });

      // (선택) 관련 메시지 등 추가 삭제 로직 필요시 여기에 작성

      return res
        .status(200)
        .json({ ok: true, deletedMeetupId: existingMeetup.id });
    } catch (error) {
      console.error("Error deleting chat meetup:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to delete chat meetup" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default withApiSession(
  withHandler({
    methods: ["POST", "PATCH", "GET", "DELETE"],
    handler,
    isPrivate: true,
  })
);
