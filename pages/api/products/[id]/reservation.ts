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

  const reserveExist = await client.reservation.findFirst({
    where: {
      productId: Number(id),
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

  if (req.method === "GET") {
    res.json({ ok: true, isReserved: reserveExist ? true : false, reserve: reserveExist });
  }
  if (req.method === "POST") {
    try {
      await client.$transaction(async (prisma) => {
        if (reserveExist) {
          await prisma.reservation.delete({
            where: {
              id: reserveExist.id,
            },
          });
          await prisma.product.update({
            where: {
              id: Number(id),
            },
            data: {
              status: Status.Registered,
            },
          });
          res.json({ ok: true, isReserved: false });
        } else {
          if (!buyerId) {
            throw new Error("buyerId is not given in request body.");
          }
          const buyerExist = Boolean(
            await prisma.user.findUnique({
              where: { id: +buyerId },
            })
          );
          if (buyerExist === false) {
            throw new Error("buyerId is not valid.");
          }
          await prisma.reservation.create({
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
          await prisma.product.update({
            where: {
              id: Number(id),
            },
            data: {
              status: Status.Reserved,
            },
          });
          res.json({ ok: true, isReserved: true });
        }
      });
    } catch (error) {
      console.error("Error handling reservation:", error);
      res.status(500).json({ ok: false, error: "Failed to handle reservation." });
    }
  }
  if (req.method === "DELETE") {
    if (!id) {
      return res.status(400).json({ ok: false, error: "Product ID is required." });
    }

    try {
      const reservation = await client.reservation.findFirst({
        where: {
          productId: Number(id),
        },
      });

      if (!reservation) {
        return res.status(404).json({ ok: false, error: "Reservation not found." });
      }

      await client.reservation.delete({
        where: {
          id: reservation.id,
        },
      });

      res.status(200).json({ ok: true, message: "Reservation deleted successfully." });
    } catch (error) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ ok: false, error: "Failed to delete reservation." });
    }
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST", "DELETE"],
    handler,
  })
);
