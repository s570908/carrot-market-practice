import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { NextApiResponseServerIo } from "@/types/types";

const workspace = "market"; // 오타 수정

// 이 파일(chat-meetups/index.ts)은 약속(chatMeetup) 생성 및 관련 메시지 생성을 트랜잭션으로 처리합니다.
// 
// 주요 기능:
// 1. sellerChat 메시지("약속을 만들었어요") 생성
// 2. chatMeetup(약속) 생성 및 메시지와 연결
// 3. 소켓 이벤트로 실시간 약속 메시지 전송
// 4. alarmTime을 포함한 약속 데이터 저장
// 
// 처리 흐름:
// - Prisma $transaction을 사용해 메시지와 약속을 원자적으로 생성
// - 생성된 약속 정보를 Socket.io를 통해 채팅방 참여자들에게 실시간 전송
// - appointmentTime, place, locationLatitude/Longitude, alarmTime 등 약속 상세 정보 저장
// 
// 참고사항:
// - 알람(AlarmSetting) 생성 및 스케줄링은 별도의 alarm-settings API에서 처리
// - 실제 알림 트리거는 alarmScheduler를 통해 관리

async function handler(
  req: NextApiRequest, res: NextApiResponseServerIo
) {
  if (req.method === "POST") {
    // Add logging to match client-side function
    //console.log("API received params:", req.body);
    
    // Updated to use flattened location properties
    const {
      body: { appointmentTime, place, locationLatitude, locationLongitude,alarmTime, chatRoomId },
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

    // 유효한 날짜 확인
    if (isNaN(new Date(appointmentTime).getTime())) {
      return res.status(400).json({ 
        ok: false, 
        error: "유효하지 않은 약속 시간 형식입니다" 
      });
    }

    const channel = `/ws-${workspace}-${chatRoomId}`; // 오타 수정

    try {
      // Prisma $transaction을 사용해 메시지와 약속을 원자적으로 생성
      const [message, chatMeetup] = await client.$transaction(async (prisma) => {
        const createdMessage = await prisma.sellerChat.create({
          data: {
            chatMsg: "약속을 만들었어요",
            user: { connect: { id: user.id } },
            chatRoom: { connect: { id: +chatRoomId } },
          },
        });
        
        const createdChatMeetup = await prisma.chatMeetup.create({
          data: {
            appointmentTime: new Date(appointmentTime),
            place,
            locationLatitude,
            locationLongitude,
            alarmTime,
            message: { connect: { id: createdMessage.id } },
          },
          include: { message: true }
        });
        
        return [createdMessage, createdChatMeetup];
      });

      // 소켓 이벤트 - 더 안전한 에러 처리 추가
      if (res?.socket?.server?.io) {
        try {
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
             alarmTime: chatMeetup.alarmTime
            },
            type: "appointment"
          };
          res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("message", socketMessage);
          console.log(`Emitting message socket event to channel: ${channel}`);
        } catch (socketError) {
          console.error("소켓 이벤트 전송 실패:", socketError);
          // 소켓 실패해도 API 응답은 성공으로 처리
        }
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
        error: "약속 생성에 실패했습니다: " + (error instanceof Error ? error.message : String(error))
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
