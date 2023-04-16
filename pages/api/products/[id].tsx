import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id ? (req.query.id as String) : "";
  if (!id) {
    res.status(404).end({ error: "request query is not given." });
  }
  const product = await client.product.findUnique({
    where: {
      id: +id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  /**
			product.name: "Samsung Galay40"

			["Samsung", "Galay40"]

			[ {name: {contains: "Samsung" }}, 
				name: {contains: "Galay40" }}
      ]

			https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#or
	**/

  const terms = product?.name.split(" ").map((word) => ({
    name: { contains: word },
  }));

  const relatedProducts = await client.product.findMany({
    where: {
      OR: terms,
      AND: {
        id: {
          not: product?.id,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log("product: ", product);
  console.log("relatedProducts: ", relatedProducts);
  res.status(200).json({ ok: true, product: product, relatedProducts: relatedProducts });
};

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
