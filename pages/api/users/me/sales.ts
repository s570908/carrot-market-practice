import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    session: { user },
    query: { page },
  } = req;
  if (!page) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const limit = 10;
  // client.record.findMany({
  //   where: {
  //     userId: user?.id,
  //     kind: "Fav",
  //   },
  // });
  const sales = await client.sale.findMany({
    where: {
      userId: user?.id,
    },
    include: {
      product: {
        include: {
          favs: {
            where: {
              userId: user?.id,
            },
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              favs: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: (+page - 1) * limit,
  });
  const next = await client.sale.findMany({
    where: {
      userId: user?.id,
    },
    include: {
      product: {
        include: {
          favs: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              favs: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: (+page + 1 - 1) * limit,
  });
  res.json({
    ok: true,
    sales,
    next,
  });
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
