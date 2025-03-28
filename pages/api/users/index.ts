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
    query: { page = "1", pageSize = "20", search },
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  try {
    const currentPage = parseInt(page.toString());
    const itemsPerPage = parseInt(pageSize.toString());
    const skip = (currentPage - 1) * itemsPerPage;

    // 검색 조건 설정
    const where = search
      ? {
          name: {
            contains: search.toString(),
          },
          NOT: {
            id: user.id, // 현재 사용자 제외
          },
        }
      : {
          NOT: {
            id: user.id, // 현재 사용자 제외
          },
        };

    // 사용자 목록 조회
    const users = await client.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      skip,
      take: itemsPerPage,
      orderBy: {
        name: "asc",
      },
    });

    // 총 사용자 수 조회
    const totalUsers = await client.user.count({ where });
    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    // 다음 페이지 계산
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    return res.json({
      ok: true,
      users,
      totalPages,
      nextPage,
    });
  } catch (error) {
    console.error("사용자 목록 조회 중 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다" });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
