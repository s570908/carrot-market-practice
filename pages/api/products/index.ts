import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  if (req.method === "GET") {
    const {
      query: { page },
    } = req;
    // const page = req.query.page ? (req.query.page as String) : "";
    if (!page) {
      return res.status(404).end({ error: "request query is not given." });
    }
    const limit = 10;
    const products = await client.product.findMany({
      where: {
        isSell: false,
      },
      include: {
        _count: {
          select: {
            favs: true,
          },
        },
        favs: {
          select: {
            userId: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
      take: limit,
      skip: (+page - 1) * limit,
      orderBy: { createdAt: "desc" },
    });
    const nextProducts = await client.product.findMany({
      where: {
        isSell: false,
      },
      include: {
        _count: {
          select: {
            favs: true,
          },
        },
        favs: {
          select: {
            userId: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
      take: limit,
      skip: (+page + 1 - 1) * limit,
      orderBy: { createdAt: "desc" },
    });
    res.json({
      ok: true,
      products,
      nextProducts,
    });
  }

  if (req.method === "POST") {
    const {
      body: { name, price, description, photoId },
      session: { user },
    } = req;
    const products = await client.product.create({
      data: {
        image: photoId,
        name,
        price: +price,
        description,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    res.json({
      ok: true,
      products,
    });
  }
};

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
