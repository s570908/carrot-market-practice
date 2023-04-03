import withHandler from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

interface reqBodyType {
  email?: string;
  phone?: string;
}

const handler: NextApiHandler<void> = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, phone }: reqBodyType = req.body;
  console.log("req.body", req.body);
  return res.status(200).end();
};
//export default handler;

export default withHandler("POST", handler);
// withHandler(...)는 function이다. 이 function은 ...
// request method가 POST 가 아니면 res에 에러를 전송한다.
// ...이면, handler를 수행시킨다. handler 수행 시에 catch(error)를
// 할 수 있다.
