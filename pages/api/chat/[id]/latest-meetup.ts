import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const chatRoomId = Number(req.query.id);

    if (!chatRoomId) {
      return res
        .status(400)
        .json({ ok: false, error: "채팅방 ID가 필요합니다." });
    }

    try {
      // 가장 최근의 약속 메시지 가져오기
      const latestMeetup = await client.chatMeetup.findFirst({
        where: {
          message: {
            chatRoomId: chatRoomId,
          },
        },
        orderBy: {
          createdAt: "desc", // 약속이 생성된 시간 기준으로 정렬
        },
        select: {
          id: true,
          appointmentTime: true,
          place: true,
          locationLatitude: true,
          locationLongitude: true,
          alarmTime: true, // 알람 시간 추가
        },
      });

      console.log("================latestMeetup: ", latestMeetup);

      if (!latestMeetup) {
        return res
          .status(404)
          .json({ ok: false, error: "최근 약속이 없습니다." });
      }

      return res.status(200).json({
        ok: true,
        latestMeetupId: latestMeetup.id,
        appointmentTime: latestMeetup.appointmentTime,
      });
    } catch (error) {
      console.error("Error fetching latest meetup:", error);
      return res
        .status(500)
        .json({ ok: false, error: "서버 오류가 발생했습니다." });
    }
  }

  return res
    .status(405)
    .json({ ok: false, error: "허용되지 않은 메서드입니다." });
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler, isPrivate: true })
);

// where: { message: { chatRoomId: chatRoomId } }는
// chatMeetup 테이블에서 message 테이블과의 관계를 통해
// 해당 chatRoomId에 속한 모든 chatMeetup을 가져옵니다.
// 즉, chatMeetup이 연결된 message의 chatRoomId가 chatRoomId와 일치하는 모든 chatMeetup을 조회합니다.
