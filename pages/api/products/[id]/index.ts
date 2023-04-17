import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = req.session.user; // login user
  const id = req.query.id ? (req.query.id as String) : "";
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
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

  // login user인 내가 좋아요를 눌렀는지를 체크하여 이것을 reponse로 내보낸다: isLiked
  // login user의 user.id, product는 product.id로 되어 있는 record를 fav 테이블에서 찾는다.
  // 있으면 내가 좋아요를 누른 것이다.
  const isLiked = Boolean(
    await client.fav.findFirst({
      where: {
        userId: user?.id,
        productId: product?.id,
      },
    })
  );

  //console.log("product: ", product);
  //console.log("relatedProducts: ", relatedProducts);
  console.log("product [id] handler: id, isLiked ", id, isLiked);
  res.status(200).json({ ok: true, isLiked, product: product, relatedProducts: relatedProducts });
};

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
