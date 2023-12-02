import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const {
      query: { id },
      session: { user },
    } = req;
    // const page = req.query.page ? (req.query.page as String) : "";
    if (!id) {
      return res.status(404).end({ error: "request query is not given." });
    }
    const foundStream = await client.stream.findUnique({
      where: {
        id: +id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (foundStream === null || foundStream === undefined) {
      return res.status(404).json({ ok: false, message: "존재하지 않는 스트리밍입니다." });
    }

    //console.log("api.streams.[id].index---foundStream: ", JSON.stringify(foundStream, null, 2));

    if (foundStream.userId !== user?.id) {
      foundStream.cloudflareUrl = "";
      foundStream.cloudflareKey = "";
    }

    let recordedVideos = undefined;
    if (foundStream.cloudflareId) {
      recordedVideos = await (
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${foundStream.cloudflareId}/videos`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
            },
          }
        )
      ).json();
    }

    // console.log(
    //   "api.streams.[id].index---recordedVideos: ",
    //   JSON.stringify(recordedVideos, null, 2)
    // );

    return res.status(200).json({
      ok: true,
      message: "스트리밍 보기에 성공하였습니다.",
      stream: foundStream,
      recordedVideos,
    });
  } catch (error) {
    console.log("stream detail handler error");
    return res.status(400).json({ ok: false, message: "스트리밍 보기에 실패하였습니다." });
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
