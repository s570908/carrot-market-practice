import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

/**
 * 친구 관리 API 핸들러
 * - GET: 친구 목록 조회 (user.friendships - "UserFriendships" 관계)
 * - POST: 친구 추가 (새로운 Friendship 생성하여 "FriendInvited" 관계 설정)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    session: { user },
    body: { name },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  try {
    // GET: 친구 목록 조회
    if (req.method === "GET") {
      const friends = await client.friendship.findMany({
        where: {
          userId: user.id,
        },
        include: {
          friend: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return res.json({
        ok: true,
        friends: friends.map((friendship) => friendship.friend),
      });
    }

    // POST: 친구 추가
    if (req.method === "POST") {
      if (!name) {
        return res.status(400).json({ ok: false, error: "친구 이름을 입력해주세요" });
      }

      // 1. 이름으로 사용자 찾기
      const targetUser = await client.user.findFirst({
        where: {
          name: {
            contains: name,
          },
          NOT: {
            id: user.id, // 자기 자신은 제외
          },
        },
      });

      if (!targetUser) {
        return res.status(404).json({ ok: false, error: "해당 이름의 사용자를 찾을 수 없습니다" });
      }

      // 2. 이미 친구인지 확인
      const existingFriendship = await client.friendship.findFirst({
        where: {
          userId: user.id,
          friendId: targetUser.id,
        },
      });

      if (existingFriendship) {
        return res.status(400).json({ ok: false, error: "이미 친구로 등록된 사용자입니다" });
      }

      // 3. 친구 관계 생성
      const friendship = await client.friendship.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          friend: {
            connect: {
              id: targetUser.id,
            },
          },
        },
      });

      return res.json({
        ok: true,
        friend: {
          id: targetUser.id,
          name: targetUser.name,
          avatar: targetUser.avatar,
        },
      });
    }

    return res.status(405).json({ ok: false, error: "허용되지 않은 메서드입니다" });
  } catch (error) {
    console.error("친구 관리 중 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다." });
  }
}

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
