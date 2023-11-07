import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "POST") {
    const {
      query: { id, seller },
      session: { user },
      body: { review, score },
    } = req;
    if (!id || !seller) {
      return res.status(404).end({ error: "request query is not given." });
    }
    const writtenReview = await client.review.create({
      data: {
        review,
        score,
        createdBy: {
          connect: {
            id: user?.id,
          },
        },
        createdFor: {
          connect: {
            id: +seller,
          },
        },
        productFor: {
          connect: {
            id: +id,
          },
        },
      },
    });
    res.json({ ok: true, writtenReview });
  }
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
