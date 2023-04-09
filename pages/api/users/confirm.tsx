import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

interface reqBodyType {
  token?: string;
}

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  // const token = req.body.token;
  const { token }: reqBodyType = req.body;
  console.log("confirm--token: ", req.body);
  res.status(200).json({ ok: true, token }); // 주의! res.status(200).end({ ok: true, token })로 하면 안된다.
};

export default withHandler("POST", handler);
