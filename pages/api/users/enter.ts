import client from "@libs/client/client";
import withHandler from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, phone } = req.body;
  if (req.method === "POST") {
    console.log("req.body: ", req.body);
    // console.log("req: ", req);
    // console.log("reqs: ", res);
    if (email) {
      const existUser = await client.user.findUnique({
        where: { email: email },
      });
      if (!existUser) {
        const user = await client.user.create({
          data: {
            name: "Anonymous",
            email: email,
          },
        });
        console.log("user: ", user);
      }
      console.log("existUser: ", existUser);
    }
    if (phone) {
      const existUser = await client.user.findUnique({
        where: { phone: phone },
      });
      if (!existUser) {
        const user = await client.user.create({
          data: {
            name: "Anonymous",
            phone: phone,
          },
        });
        console.log("user: ", user);
      }
      console.log("existUser: ", existUser);
    }
    res.status(200).json({ ok: true });
  } else {
    res.status(401).end();
  }
};

export default withHandler(handler);
