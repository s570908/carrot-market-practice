import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id, page },
    session: { user },
  } = req;
  if (!id || !page) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const limit = 10;
  const post = await client.post.findUnique({
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
      answers: {
        select: {
          answer: true,
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        take: limit,
        skip: (+page - 1) * limit,
      },
      _count: {
        select: {
          answers: true,
          wonderings: true,
        },
      },
    },
  });
  const isWondering = await client.wondering.findFirst({
    where: {
      postId: +id,
      userId: user?.id,
    },
    select: {
      id: true,
    },
  });
  res.json({
    ok: true,
    post,
    isWondering,
  });
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
