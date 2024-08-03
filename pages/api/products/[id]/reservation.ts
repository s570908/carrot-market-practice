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
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
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
      if (!buyerId) {
        return res.status(404).json({ ok: false, error: "buyerId is not given in request body." });
      }
      const buyerExist = Boolean(await client.user.findUnique({
        where: { id: +buyerId}
      }))
      console.log("=== buyerExist: ",  buyerExist)
      if (buyerExist === false) {
        return res.status(404).json({ ok: false, error: "buyerId is not valid." });
      } 
      await client.reservation.create({
        data: {
          user: {
            connect: {
              id: +buyerId,
            },
          },
          product: {
            connect: {
              id: Number(id),
            },
          },
        },
      });
      // Update the product to set isReserved to true once the reservation is made
      await client.product.update({
        where: {
          id: Number(id),
        },
        data: {
          status: Status.Reserved,
        },
      });
      res.json({ ok: true, isReserved: true });
    }
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);

// withIronSessionApiRoute로 감싸면 req.session을 확인할 수 있다.
