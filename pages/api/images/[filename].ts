import type { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import path from "path";
import { promises as fs } from "fs";
import { withApiSession } from "@libs/server/withSession";

// Vercel에서 Local File 사용해보기
// https://sooros.com/using-local-files-in-vercel

const CACHE_PATH =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "notion-blog-kit", "notion", "cache")
    : path.join(process.cwd(), "public", "uploads");

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { filename } = req.query;
  console.log("filePath: ", filename);

  if (typeof filename === "string") {
    const readPath = path.join(CACHE_PATH, filename);

    const content = await fs.readFile(readPath, "utf-8");

    res.status(200).send(content);
    return;
  }
  res.status(400).json({ ok: false, error: "filePath가 잘못되었습니다." });
  return;
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
