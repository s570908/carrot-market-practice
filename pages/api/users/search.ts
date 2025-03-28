import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const {
    session: { user },
    query: { name },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  if (!name || typeof name !== "string") {
    return res.status(400).json({ ok: false, error: "검색어를 입력해주세요" });
  }

  try {
    // 사용자 검색
    const users = await client.user.findMany({
      where: {
        name: {
          contains: name,
        },
        NOT: {
          id: user.id, // 현재 사용자 제외
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 10, // 최대 10명까지만 표시
    });

    // 이미 친구인 사용자 필터링
    const friends = await client.friendship.findMany({
      where: {
        userId: user.id,
      },
      select: {
        friendId: true,
      },
    });

    const friendIds = new Set(friends.map((f) => f.friendId));

    // 친구가 아닌 사용자만 반환
    const filteredUsers = users.filter((u) => !friendIds.has(u.id));

    return res.json({
      ok: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.error("사용자 검색 중 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다" });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
