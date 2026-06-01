import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import client from "@libs/client/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const latest = await client.appRelease.findFirst({
    orderBy: { releasedAt: "desc" },
    select: { version: true, buildId: true, forceUpdate: true, message: true, releasedAt: true },
  });

  if (!latest) {
    return res.status(200).json({ ok: true, version: null });
  }

  return res.status(200).json({ ok: true, ...latest });
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler, isPrivate: false })
);
