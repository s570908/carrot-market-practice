import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(401).end;
  }
  try {
    console.log("req.body", req.body);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
}

export default handler;
