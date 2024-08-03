import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { Status } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const {
      query: { id },
      body: { buyerId },
      session: { user },
    } = req;
    if (!id || !buyerId) {
      return res
        .status(404)
        .end({ error: "request query, id or sellor, is not given." });
    }
    const reserveExist = await client.reservation.findFirst({
      where: {
        productId: Number(id),
      },
    });
    if (reserveExist) {
      // 예약한 사람과 사려는 사람이 다른 경우에 에러 메세지가 나온다.
      if (reserveExist.userId !== Number(buyerId)) {
        return res
          .status(404)
          .json({
            error: "buyer is not the reserved user. so you can't sell.",
          });
      } else {
        // 예약한 사람에게 물건을 판매하는 경우 기존의 예약은 삭제하고 거래완료를 한다.
        await client.reservation.delete({
          where: {
            id: reserveExist.id,
          },
        });
      }
    }
    // login user sells
    // 사려는 자에게 물건을 파는 경우 sale과 purchase를 만든다.
    const saleProduct = await client.sale.create({
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

    // buyer purchases
    const purchaseProduct = await client.purchase.create({
      data: {
        user: {
          connect: {
            id: +buyerId,
          },
        },
        product: {
          connect: {
            id: +id,
          },
        },
      },
    });
    await client.product.update({
      where: {
        id: +id,
      },
      data: {
        status: Status.Sold // this product has been sold. isSell is absurd and isSold is correct but I will leave unchanged
      },
    });

    const product = await client.product.findUnique({
      where: {
        id: +id,
      },
      select: {
        status: true
      },
      // user: {
      //   select: {
      //     id: true,
      //     name: true,
      //     avatar: true,
      //   },
      // },
      // productReviews: {
      //   select: {
      //     createdBy: {
      //       select: {
      //         name: true,
      //         avatar: true,
      //       },
      //     },
      //     review: true,
      //     score: true,
      //     createdAt: true,
      //   },
      // },
    });
    console.log("product.status: ", product?.status);
   
    res.json({ ok: true, purchaseProduct, saleProduct });
  }
  if (req.method === "GET") {
    const user = req.session.user; // login user
    const {
      query: { id },
    } = req;
    // const page = req.query.page ? (req.query.page as String) : "";
    if (!id) {
      return res.status(404).json({ error: "request query is not given." });
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
            avatar: true,
          },
        },
        productReviews: {
          select: {
            createdBy: {
              select: {
                name: true,
                avatar: true,
              },
            },
            review: true,
            score: true,
            createdAt: true,
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
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      // include: {
      //   user: {
      //     select: {
      //       id: true,
      //       name: true,
      //     },
      //   },
      // },
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
        select: {
          id: true,
        },
      })
    );

    //console.log("product: ", product);
    //console.log("relatedProducts: ", relatedProducts);
    console.log("/api/products/[id] : id, isLiked ", id, isLiked);
    res
      .status(200)
      .json({
        ok: true,
        isLiked,
        product: product,
        relatedProducts: relatedProducts,
      });
  }
};

export default withApiSession(
  withHandler({ methods: ["GET", "POST"], handler, isPrivate: true })
);
