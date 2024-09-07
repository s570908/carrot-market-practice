import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  console.log("---------------Post /api/product/[id]/reviewNew is called" )
  if (req.method === "POST") {
    const {
      query: { id },
      session: { user },
      body: { createdForId, review, score, reviewType },
    } = req;
    console.log("query: ", req.query)
    console.log("body: ", req.body)
    if (!id || !createdForId) {
      return res.status(404).end({ error: "request query is not given." });
    }
    const writtenReview = await client.review.create({
      data: {
        review,
        score: +score,
        reviewType,
        createdBy: {
          connect: {
            id: user?.id,
          },
        },
        createdFor: {
          connect: {
            id: +createdForId,
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
