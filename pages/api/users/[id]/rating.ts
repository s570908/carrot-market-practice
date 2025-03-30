import { NextApiRequest, NextApiResponse } from "next";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ ok: false, error: "유효하지 않은 사용자 ID입니다." });
  }

  try {
    // 해당 사용자가 받은 모든 리뷰(createdForId가 사용자 ID인 리뷰들) 조회
    const reviews = await client.review.findMany({
      where: {
        createdForId: +id,
      },
      select: {
        score: true,
      },
    });

    if (reviews.length === 0) {
      return res.json({
        ok: true,
        averageScore: 0,
        reviewCount: 0,
      });
    }

    // 평균 점수 계산
    const totalScore = reviews.reduce((sum, review) => sum + review.score, 0);
    const averageScore = totalScore / reviews.length;

    return res.json({
      ok: true,
      averageScore: Number(averageScore.toFixed(1)),
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("판매자 평점 조회 중 오류 발생:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다." });
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET"],
    handler,
    isPrivate: false,
  })
);
