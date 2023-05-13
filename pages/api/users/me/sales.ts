// import withHandler from "@libs/server/withHandler";
// import { withApiSession } from "@libs/server/withSession";
// import { NextApiRequest, NextApiResponse } from "next";

// const handler = (req: NextApiRequest, res: NextApiResponse) => {
//   console.log("sales handler");
//   res.status(200).json({ ok: true });
// };

// export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));

import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    session: { user },
  } = req;
  const sales = await client.sale.findMany({
    where: {
      userId: user?.id,
    },
    include: {
      product: {
        include: {
          _count: {
            select: {
              favs: true,
            },
          },
        },
      },
    },
  });

  res.json({
    ok: true,
    sales,
  });
}

export default withApiSession(
  withHandler({
    methods: ["GET"],
    isPrivate: true,
    handler,
  })
);
