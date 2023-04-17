import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  const { question } = req.body;
  const { user } = req.session;

  if (req.method === "POST") {
    const post = await client.post.create({
      data: {
        question: question,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    res.status(200).json({ ok: true, post });
  }
};

export default withApiSession(withHandler({ methods: ["POST"], handler, isPrivate: true }));
