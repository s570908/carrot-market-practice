import type { NextApiRequest, NextApiResponse } from 'next';
import client from "@libs/client/client";
import { MessageType } from "@prisma/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiResponseServerIo } from '@/types/types';

const workspace = "market";

async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }


  //유연한 API 설계:
  // API를 확장할 때 새로운 매개변수를 계속 추가하는 대신, meta 객체 내부에 새 속성 추가 가능
  // 이는 API의 하위 호환성을 유지하는 데 도움이 됨
  // 상품 상태 변경 시스템 메시지 (추가 메타데이터 포함)
  // 예시: 상품 상태 변경 시스템 메시지
  // fetch('/api/chat/system-message', {
  //   method: 'POST',  
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     chatRoomId: 123,
  //     message: "상품 상태가 '판매중'에서 '예약중'으로 변경되었습니다.",
  //     meta: {
  //       productId: 456,
  //       oldStatus: "판매중",
  //       newStatus: "예약중",
  //       changedBy: "판매자",
  //       timestamp: new Date().toISOString()
  //     }
  //   })
  // });
  //   시스템 메시지 API에서 meta 객체의 특정 속성을 확인하고, 그에 따른 추가 작업을 수행합니다:
  // ...(meta.chatMeetup && {
  //   chatMeetup: {
  //     create: meta.chatMeetup
  //   }
  // })


  const { chatRoomId, message, userId, meta = {} } = req.body;

  //console.log("api/chat/system-message--req.body:", req.body);

  if (!chatRoomId || !message) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    // 시스템 메시지 생성
    const systemMessage = await client.sellerChat.create({
      data: {
        chatMsg: message,
        messageType: MessageType.SYSTEM,
        ...(userId ? {
          user: {
            connect: {
              id: userId
            }
          }
        } : {}),
        chatRoom: {
          connect: { id: +chatRoomId }
        },
        ...(Object.keys(meta).length > 0 ? { meta: JSON.stringify(meta) } : {})
      }
    });

    // 소켓으로 채팅 메시지 전송 (수정된 부분)
    if (res?.socket?.server?.io) {
      try {
        const channel = `/ws-${workspace}-${chatRoomId}`;
        
        // 소켓 이벤트로 전송할 메시지 데이터 구성
        const socketPayload = {
          chatRoomId: Number(chatRoomId),
          message: systemMessage  // 전체 시스템 메시지 객체 전송
        };
        
        // 이벤트 이름을 "message"로 변경
        res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("message", socketPayload);
        
        // 더 상세한 로그 추가
        console.log(`소켓 이벤트 전송 완료 [${new Date().toISOString()}]: 
          - 채널: ${channel}
          - 이벤트 타입: message
          - 메시지 ID: ${systemMessage.id}
          - 메시지 타입: ${MessageType.SYSTEM}
          - 메시지 내용: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}
          - 채팅방 ID: ${chatRoomId}`);
      } catch (socketError) {
        console.error("소켓 이벤트 전송 실패:", socketError);
      }
    } else {
      console.warn("소켓 서버가 초기화되지 않았습니다. 소켓 이벤트를 전송할 수 없습니다.");
    }

    return res.status(200).json({ 
      ok: true, 
      systemMessage
    });
  } catch (error) {
    console.error("Error creating system message:", error);
    return res.status(500).json({ ok: false, error: "Failed to create system message" });
  }
}

export default withApiSession(
  withHandler({
    methods: ["POST"],
    handler,
  })
);

