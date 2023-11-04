// import { NextApiRequest, NextApiResponse } from "next";
// import withHandler, { ResponseType } from "@libs/server/withHandler";
// import client from "@libs/client/client";
// import { withApiSession } from "@libs/server/withSession";

// async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
//   const {
//     session: { user },
//     query: { page },
//   } = req;
//   if (!page) {
//     return res.status(404).end({ error: "request query is not given." });
//   }
//   const limit = 10;
//   const favs = await client.fav.findMany({
//     where: {
//       userId: user?.id,
//     },
//     include: {
//       product: {
//         include: {
//           _count: {
//             select: {
//               favs: true,
//             },
//           },
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//     take: limit,
//     skip: (+page - 1) * limit,
//   });
//   const next = await client.fav.findMany({
//     where: {
//       userId: user?.id,
//     },
//     include: {
//       product: {
//         include: {
//           _count: {
//             select: {
//               favs: true,
//             },
//           },
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//     take: +limit,
//     skip: (+page + 1 - 1) * +limit,
//   });
//   res.json({
//     ok: true,
//     favs,
//     next,
//   });
// }

// export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));

import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    session: { user },
  } = req;
  const favs = await client.fav.findMany({
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
    favs,
  });
}

export default withApiSession(
  withHandler({
    methods: ["GET"],
    isPrivate: true,
    handler,
  })
);