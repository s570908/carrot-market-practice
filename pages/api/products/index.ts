import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  const { name, price, description } = req.body;
  const { user } = req.session;

  if (req.method === "GET") {
    const products = await client.product.findMany({
      include: {
        favs: true,
      },
    });
    console.log("/api/products--products: ", products);
    res.json({ ok: true, products });
  }

  if (req.method === "POST") {
    const product = await client.product.create({
      data: {
        image: "XX",
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
    console.log("/api/products POST product: ", product);
    res.status(200).json({ ok: true, product });
  }
};

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
