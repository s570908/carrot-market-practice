import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import products from "pages/api/products";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id },
  } = req;
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const other = await client.user.findUnique({
    where: {
      id: +id,
    },
    include: {
      sales: {
        where: {
          userId: +id,
        },
        select: {
          product: {
            select: {
              id: true,
              userId: true,
              image: true,
              name: true,
              price: true,
              productReviews: {
                select: {
                  score: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });
  res.json({
    ok: true,
    other,
  });
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
