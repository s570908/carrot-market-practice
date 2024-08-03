import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiRequest, NextApiResponse } from "next";
import { withApiSession } from "@libs/server/withSession";
import { Status } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id },
    body: { buyerId },
    session: { user },
  } = req;

  // const alreadyExists = await client.reservation.findFirst({
  //   where: {
  //     productId: Number(id),
  //     userId: user?.id,
  //   },
  // });

  const reserveExist = await client.reservation.findFirst({
    where: {
      productId: Number(id),
    },
  })

  if (req.method === "GET") {
    res.json({ ok: true, isReserved: reserveExist ? true : false, reserve: reserveExist });
  } else if (req.method === "POST") {
    if (reserveExist) {
      await client.reservation.delete({
        where: {
          id: reserveExist.id,
        },
      });
      // Update the product to set isReserved to false when the reservation is deleted
      await client.product.update({
        where: {
          id: Number(id), // Ensure you are targeting the correct product
        },
        data: {
          status: Status.Registered,
        },
      });
      res.json({ ok: true, isReserved: false });
    } else {
    // 이미 현재 사용자가 해당 상품을 sale 한 기록이 있다면?
    const alreadyEx = await client.sale.findFirst({
      where: {
        productId: Number(id),
        userId: user?.id,
      },
    });

    if (alreadyEx) {
      // Bad request: 400
      // https://uncertainty.oopy.io/05519ce4-9a62-4037-ad0a-e50def94f16e
      res.status(400).json({ ok: false, error: "you have already sold it." });
    } else {
      // create
      const sale = await client.sale.create({
        data: {
          user: {
            connect: {
              id: user?.id,
            },
          },
          product: {
            connect: {
              id: Number(id),
            },
          },
        },
      });
      console.log("product/[id]/sale handler--sale created: ", sale);
      res.status(200).json({ ok: true });
    }
    // if (req.method === "POST") {
    //     // 이미 현재 사용자가 해당 상품을 sale 한 기록이 있다면?
    //     const alreadyEx = await client.sale.findFirst({
    //       where: {
    //         productId: +id,
    //         userId: user?.id,
    //       },
    //     });
    
    //     if (alreadyEx) {
    //       // Bad request: 400
    //       // https://uncertainty.oopy.io/05519ce4-9a62-4037-ad0a-e50def94f16e
    //       res.status(400).json({ ok: false, error: "you have already sold it." });
    //     } else {
    //       // create
    //       const sale = await client.sale.create({
    //         data: {
    //           user: {
    //             connect: {
    //               id: user?.id,
    //             },
    //           },
    //           product: {
    //             connect: {
    //               id: +id,
    //             },
    //           },
    //         },
    //       });
    //       console.log("product/[id]/sale handler--sale created: ", sale);
    //       res.status(200).json({ ok: true });
    //     }
    //   }
    // }
  }
}
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);

// withIronSessionApiRoute로 감싸면 req.session을 확인할 수 있다