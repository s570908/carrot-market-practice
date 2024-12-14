import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { Status } from "@prisma/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  if (req.method === "GET") {
    const {
      query: { page, limit },
    } = req;
    // const page = req.query.page ? (req.query.page as String) : "";
    const limitValue = limit ? parseInt(limit as string, 10) : 10; // 기본 limit 값 10

    if (!page) {
      return res.status(404).end({ error: "request query is not given." });
    }
    // const limit = 10;
    const products = await client.product.findMany({
      where: {
        OR: [
          { status: Status.Registered },
          { status: Status.Reserved },
        ],
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
      take: limitValue,
      skip: (+page - 1) * limitValue,
      orderBy: { createdAt: "desc" },
    });
    const nextProducts = await client.product.findMany({
      where: {
        OR: [
          { status: Status.Registered },
          { status: Status.Reserved },
        ],
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
      take: limitValue,
      skip: (+page + 1 - 1) * limitValue,
      orderBy: { createdAt: "desc" },
    });
    res.json({
      ok: true,
      products,
      nextProducts,
    });
  }

  if (req.method === "POST") {
    // const {
    //   body: { name, price, description, photoId },
    //   session: { user },
    // } = req;
    // const products = await client.product.create({
    //   data: {
    //     image: photoId,
    //     name,
    //     price: +price,
    //     description,
    //     user: {
    //       connect: {
    //         id: user?.id,
    //       },
    //     },
    //   },
    // });
    const {
      body: { name, price, description, images },
      session: { user },
    } = req;
// images 데이터를 Prisma가 기대하는 형태로 변환
const productImages = images.map((image: { imageId: string }) => ({
  imageId: image.imageId, // ProductImage 모델의 필드 이름에 맞게 변경
}));
    const products = await client.product.create({
      data: {
        name,
        price: +price,
        description,
        user: {
          connect: {
            id: user?.id,
          },
        },
        images: {
          create: productImages, // Prisma가 요구하는 형식으로 전달
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
