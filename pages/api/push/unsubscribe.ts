import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import client from "@libs/client/client";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    session: { user },
    body: { endpoint }
  } = req;

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
  }

  try {
    // 구독 정보 삭제
    await client.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        endpoint
      }
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("구독 삭제 오류:", error);
    return res.status(500).json({ ok: false, error: "구독 삭제 실패" });
  }
}

export default withApiSession(
  withHandler({
    methods: ["POST"],
    handler,
    isPrivate: true,
  })
);
