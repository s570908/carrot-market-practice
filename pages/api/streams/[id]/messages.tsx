import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const {
      query: { id },
      body,
      session: { user },
    } = req;

    if (!id) {
      return res.status(404).end({ error: "request query is not given." });
    }
    // const page = req.query.page ? (req.query.page as String) : "";

    const foundStream = await client.stream.findUnique({ where: { id: +id } });
    if (foundStream === null || foundStream === undefined) {
      return res.status(404).json({ ok: false, message: "존재하지 않는 스트리밍입니다." });
    }

    const streamMessage = await client.message.create({
      data: {
        message: body.message,
        stream: {
          connect: {
            id: +id,
          },
        },
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });

    return res.status(200).json({ ok: true, streamMessage });
  } catch (error) {
    console.log("stream detail message add handler error");
    return res.status(400).json({ ok: false, message: "스트리밍 메세지 생성에 실패하였습니다." });
  }
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
