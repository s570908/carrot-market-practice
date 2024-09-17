import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "types/types";
//import NextApiResponseServerIO from "../../types/next";

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method === "POST") {
    // get message
    const message = req.body;

    // dispatch to channel "message"
    res?.socket?.server?.io?.emit("message", message);

    // return message
    res.status(201).json(message);
  }
}
