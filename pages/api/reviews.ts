import { delay } from "@libs/utils";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = req.session.user;
  const { review, score, createdById, createdForId } = req.body;

  if (req.method === "GET") {
    await delay(5000);
    const reviews = await client.review.findMany({
      where: {
        createdForId: user?.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
    console.log("GET /api/reviews--reviews: ", reviews);
    res.json({
      ok: true,
      reviews,
    });
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET"],
    isPrivate: true,
    handler,
  })
);
