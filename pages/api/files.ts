import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const { count } = req.query; // 요청에서 필요한 URL 개수를 받음
  const urlCount = Number(count) || 1; // 기본적으로 1개의 URL 생성

  const uploadURLs = await Promise.all(
    Array.from({ length: urlCount }).map(async () => {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v2/direct_upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CF_IMAGE_TOKEN}`,
          },
        }
      ).then((res) => res.json());
      return response.result;
    })
  );

  res.json({
    ok: true,
    uploadURLs,
  });
}

export default withApiSession(withHandler({ methods: ["GET"], handler, isPrivate: true }));
