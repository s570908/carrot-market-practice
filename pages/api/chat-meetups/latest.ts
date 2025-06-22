import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { chatRoomId } = req.query;
    const { user } = req.session;

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    if (!chatRoomId) {
      return res.status(400).json({ ok: false, error: "chatRoomId가 필요합니다" });
    }

    try {
      // 가장 최근 약속 조회 (시간순 정렬)
      const latestMeetup = await client.chatMeetup.findFirst({
        where: {
          message: {
            chatRoomId: Number(chatRoomId)
          }
        },
        orderBy: { createdAt: "desc" },
        include: {
          message: {
            include: {
              chatRoom: true,
              user: true
            }
          }
        }
      });

      return res.json({
        ok: true,
        meetup: latestMeetup
      });
    } catch (error) {
      console.error("Error fetching latest meetup:", error);
      return res.status(500).json({
        ok: false,
        error: "약속 정보 조회에 실패했습니다"
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler, isPrivate: true })
);

