import { NextApiRequest, NextApiResponse } from "next";

import { PrismaClient } from "@prisma/client";
import { SocketAddress } from "net";

const client = new PrismaClient();
// use `prisma` in your application to read and write data in your DB

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, email } = req.body;
  const user = await client.user.create({
    data: { name: name, email: email },
  });
  res.status(200).json({ ok: "hello", user: user });
};

export default handler;
