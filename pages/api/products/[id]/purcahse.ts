import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("test");
  const {
    query: { id },
  } = req;
  // const page = req.query.page ? (req.query.page as String) : "";
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const { user } = req.session;

  console.log("/api/products/:id/purchase-- productId, user.id", id, user?.id);

  if (req.method === "POST") {
    // 이미 현재 사용자가 해당 상품을 purchase 한 기록이 있다면?
    const alreadyEx = await client.purchase.findFirst({
      where: {
        productId: +id.toString(),
        userId: user?.id,
      },
    });

    if (alreadyEx) {
      // Bad request: 400
      // https://uncertainty.oopy.io/05519ce4-9a62-4037-ad0a-e50def94f16e
      res.status(400).json({ ok: false, error: "you have already sold it." });
    } else {
      // create
      const purchase = await client.purchase.create({
        data: {
          user: {
            connect: {
              id: user?.id,
            },
          },
          product: {
            connect: {
              id: +id,
            },
          },
        },
      });
      console.log("product/[id]/purchase handler--purchase created: ", purchase);
      res.status(200).json({ ok: true });
    }
  }
};

export default withApiSession(withHandler({ methods: ["POST"], handler, isPrivate: true }));
