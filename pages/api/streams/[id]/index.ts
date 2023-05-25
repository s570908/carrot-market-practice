import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { id },
    session: { user },
  } = req;
  // const page = req.query.page ? (req.query.page as String) : "";
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  const stream = await client.stream.findUnique({
    where: {
      id: +id.toString(),
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
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          created: "asc",
        },
      },
    },
  });
  const { result } = await (
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${stream?.cloudflareId}/videos`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
        },
      }
    )
  ).json();
  const { live } = await (
    await fetch(`https://videodelivery.net/${stream?.cloudflareId}/lifecycle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      },
    })
  ).json();
  if (result) {
    await client.stream.update({
      where: {
        id: +id.toString(),
      },
      data: {
        replayVideoId: result[0].uid,
      },
    });
  }
  const isOwner = stream?.userId === user?.id;
  if (stream && !isOwner) {
    stream.cloudflareKey = "xxxxx";
    stream.cloudflareUrl = "xxxxx";
  }
  res.json({ ok: true, stream, live });
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
