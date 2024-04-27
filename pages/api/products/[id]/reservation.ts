import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiRequest, NextApiResponse } from "next";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id },
    session: { user },
  } = req;

  const alreadyExists = await client.reservation.findFirst({
    where: {
      productId: Number(id),
      userId: user?.id,
    },
  });

  const reservExists = Boolean(
    await client.reservation.findFirst({
      where: {
        productId: Number(id),
      },
    })
  );

  if (req.method === "GET") {
    res.json({ ok: true, isReserved: reservExists ? true : false, reserve: alreadyExists });
  } else if (req.method === "POST") {
    if (alreadyExists) {
      await client.reservation.delete({
        where: {
          id: alreadyExists.id,
        },
      });
      res.json({ ok: true, isReserved: false });
    } else {
      await client.reservation.create({
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
