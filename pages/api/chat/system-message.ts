import type { NextApiRequest, NextApiResponse } from 'next';
import client from "@libs/client/client";
import { MessageType } from "@prisma/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>
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

  console.log("api/chat/system-message--req.body:", req.body);

  if (!chatRoomId || !message) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    // 시스템 메시지 생성 - 메타 데이터만 저장하고 별도 조회 로직 제거
    const systemMessage = await client.sellerChat.create({
      data: {
        chatMsg: message,
        messageType: MessageType.SYSTEM,
        // userId가 있는 경우 user 연결, 없으면 user 필드 자체를 생략
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
        // 메타데이터 필드 저장 - meta 객체 전체를 JSON 문자열로 변환하여 저장
        ...(Object.keys(meta).length > 0 ? { meta: JSON.stringify(meta) } : {})
      }
    });

    console.log("System message created--systemMessage:", systemMessage);

    return res.status(200).json({ 
      ok: true, 
      systemMessage
      // 필요한 모든 정보는 이미 meta에 포함되어 있음
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
