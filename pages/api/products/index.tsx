import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  const { name, price, description } = req.body;
  const { user } = req.session;

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

  res.status(200).json({ ok: true, product });
};

export default withApiSession(withHandler({ method: "POST", handler, isPrivate: true }));
