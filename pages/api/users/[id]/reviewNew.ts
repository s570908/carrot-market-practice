import { delay } from "@libs/utils";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import { FilterType } from "types/types";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    session: { user },
    body: { filterType },
  } = req
  
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }

  let whereKey;

if (filterType === FilterType.CreatedFor) {
  whereKey = {createdForId: +id}
} else if (filterType === FilterType.CreatedFor) {
  whereKey = {createdById: +id}
} else {
  whereKey = {
    OR: [{createdForId: +id}, {createdById: +id}],
  }
}

  if (req.method === "GET") {
    await delay(5000);
    const reviews = await client.review.findMany({
      where: whereKey,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        createdFor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        productFor: {
          select: {
            id: true,
            name: true,
            image: true
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

