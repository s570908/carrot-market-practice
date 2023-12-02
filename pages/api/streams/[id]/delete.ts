import client from "@libs/client/client";
import { NextApiRequest, NextApiResponse } from "next";
import { withApiSession } from "@libs/server/withSession";
import withHandler, { ResponseType } from "libs/server/withHandler";

const handler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  try {
    const {
      query: { id },
      session: { user },
    } = req;

    if (!id) {
      return res.status(404).end({ error: "request query is not given." });
    }

    const foundStream = await client.stream.findFirst({ where: { id: +id, userId: user?.id } });
    if (foundStream === null || foundStream === undefined) {
      return res.status(404).json({ ok: false, error: "존재하지 않는 스트리밍입니다." });
    }

    await client.stream.delete({ where: { id: +id } });

    return res.status(200).json({ ok: true, message: "스트리밍 삭제에 성공하였습니다.", stream: foundStream });
  } catch (error) {
    console.log("stream detail delete handler error");
    return res.status(400).json({ ok: false, error: "스트리밍 삭제에 실패하였습니다." });
  }
};

export default withApiSession(withHandler({ methods: ["POST"], handler, isPrivate: false }));
