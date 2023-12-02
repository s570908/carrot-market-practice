import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

interface Response {
  result: {
    uid: string;
    rtmps: {
      url: string;
      streamKey: string;
    };
    srt: {
      url: string;
      streamId: string;
      passphrase: string;
    };
    created: string;
    modified: string;
    meta: { name: string };
    status: any;
    recording: {
      mode: string;
      timeoutSeconds: number;
      requireSignedURLs: boolean;
      allowedOrigins: any;
    };
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const {
    query: { page, limit },
    session: { user },
    body: { name, price, description },
  } = req;

  if (req.method === "POST") {
    try {
      const cloudflareRequestUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs`;
      const bodyString = `{"meta": {"name":"${name}"},"recording": { "mode": "automatic", "timeoutSeconds": 10 }}`;

      //console.log("bodyString: ", bodyString);

      const countedStream = await client.stream.count({ where: { name } });
      if (countedStream !== 0) {
        console.log("api/streams/index.ts---error: 이미 존재하는 스트리밍 제목입니다.");
        return res.status(400).json({ ok: false, error: "이미 존재하는 스트리밍 제목입니다." });
      }
      const response: Response = await (
        await fetch(cloudflareRequestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
          },
          body: bodyString,
        })
      ).json();
      //console.log("/pages/api/streams/index.ts---response: ", JSON.stringify(response, null, 2));

      const createdStream = await client.stream.create({
        data: {
          cloudflareId: response.result.uid,
          cloudflareKey: response.result.rtmps.streamKey,
          cloudflareUrl: response.result.rtmps.url,
          name,
          price,
          description,
          user: { connect: { id: user?.id } },
        },
      });

      // next@12.2.0에서는 unstable_revalidate()이 revalidate()로 바뀌었다.
      // ref: https://velog.io/@real-bird/Next.js-ISR
      // await res.unstable_revalidate("/streams");

      // await res.revalidate("/stream");

      return res.status(200).json({
        ok: true,
        message: "스트리밍 생성에 성공하였습니다.",
        stream: createdStream,
      });
    } catch (error) {
      console.log("stream create handler error", error);
      return res.status(400).json({ ok: false, error: "스트리밍 생성에 실패하였습니다." });
    }
  }
  if (req.method === "GET") {
    try {
      // const page = req.query.page ? (req.query.page as String) : "";
      // const limit = req.query.limit ? (req.query.limit as String) : "";
      if (!page || !limit) {
        return res.status(404).end({ error: "request query is not given." });
      }
      const foundStreams = await client.stream.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: +limit,
        skip: (+page - 1) * +limit,
      });

      return res
        .status(200)
        .json({ ok: true, message: "전체 스트리밍 보기에 성공하였습니다.", streams: foundStreams });
    } catch (error) {
      console.log("streams handler error");
      return res.status(400).json({ ok: false, error: "전체 스트리밍 보기에 실패하였습니다." });
    }
  }
}

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
