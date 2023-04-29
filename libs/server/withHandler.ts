import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

type method = "POST" | "GET" | "DELETE";

const withHandler = (fn: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error });
  }
};

export default withHandler;
