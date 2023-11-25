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

  console.log("api.streams.[id].index---stream: ", JSON.stringify(stream, null, 2));

  let resultTmp: any;

  fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${stream?.cloudflareId}/videos`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      },
    }
  )
    .then(async (response) => {
      return await response
        .json()
        .then((data) => {
          resultTmp = data.result;
        })
        .catch((error) => {
          console.log(error, "--response.json");
        });
    })
    .catch((error) => {
      console.log(error, "--fetch cloudflare/videos");
    });

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${stream?.cloudflareId}/videos`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      },
    }
  );
  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Request failed: ${errorMessage}`);
  }
  const dataTmp = await response.json();

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

  console.log("api.streams.[id].index---resultTmp: ", JSON.stringify(resultTmp, null, 2));
  console.log("api.streams.[id].index---resultTmp2: ", JSON.stringify(dataTmp.result, null, 2));
  console.log("api.streams.[id].index---result: ", JSON.stringify(result, null, 2));

  const { live } = await (
    await fetch(`https://videodelivery.net/${stream?.cloudflareId}/lifecycle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      },
    })
  ).json();

  if (result && result.length !== 0) {
    await client.stream.update({
      where: {
        id: +id,
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
