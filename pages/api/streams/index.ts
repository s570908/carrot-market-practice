import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    session: { user },
    body: { name, price, description },
  } = req;
  const page = req.query.page ? (req.query.page as String) : "";
  const limit = req.query.limit ? (req.query.limit as String) : "";
  if (req.method === "POST") {
    const {
      result: {
        uid,
        rtmps: { streamKey, url },
      },
    } = await (
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
            body: `{"meta": {"name":${name}},"recording": { "mode": "automatic", "timeoutSeconds": 300}}`,
          },
        }
      )
    ).json();
    const stream = await client.stream.create({
      data: {
        cloudflareId: uid,
        cloudflareKey: streamKey,
        cloudflareUrl: url,
        name,
        price,
        description,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    res.json({
      ok: true,
      stream,
    });
  }
  if (req.method === "GET") {
    const streams = await client.stream.findMany({
      orderBy: {
        created: "desc",
      },
      take: +limit,
      skip: (+page - 1) * +limit,
    });
    streams.map(async (stream) => {
      const { live } = await (
        await fetch(`https://videodelivery.net/${stream.cloudflareId}/lifecycle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
          },
        })
      ).json();
      await client.stream.update({
        where: {
          id: stream.id,
        },
        data: {
          live,
        },
      });
    });
    res.json({
      ok: true,
      streams,
    });
  }
}

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
