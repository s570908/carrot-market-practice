import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

/**
 * 친구 관리 API 핸들러 - 개별 친구
 * - DELETE: 친구 삭제 ("UserFriendships" 관계에서 Friendship 레코드 삭제)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { 
    session: { user },
    query: { id },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }
  
  const friendId = Number(id);
  
  if (isNaN(friendId)) {
    return res.status(400).json({ ok: false, error: "유효하지 않은 친구 ID입니다" });
  }

  try {
    // DELETE: 친구 삭제
    if (req.method === "DELETE") {
      // 친구 관계 찾기
      const friendship = await client.friendship.findFirst({
        where: {
          userId: user.id,
          friendId
        }
      });

      if (!friendship) {
        return res.status(404).json({ ok: false, error: "친구 관계를 찾을 수 없습니다" });
      }

      // 친구 관계 삭제
      await client.friendship.delete({
        where: {
          id: friendship.id
        }
      });

      return res.json({ ok: true });
    }
    
    return res.status(405).json({ ok: false, error: "허용되지 않은 메서드입니다" });
  } catch (error) {
    console.error("친구 삭제 중 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다." });
  }
}

export default withApiSession(
  withHandler({ methods: ["DELETE"], handler, isPrivate: true })
);
