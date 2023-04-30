import withHandler from "@libs/server/withHandler-test";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("req.body", req.body);
  res.status(200).end();
};

// const withHandler = (fn: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
//   if (req.method !== "POST") {
//     res.status(401).end;
//   }
//   try {
//     await fn(req, res);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error });
//   }
// };

export default withHandler(handler);
