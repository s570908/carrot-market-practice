import withHandler from "@libs/server/withHandler";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // if (req.method !== "POST") {
  //   res.status(401).end;
  // }
  console.log("req.body", req.body);
  res.status(200).end();
}
//export default handler;

export default withHandler("POST", handler);
// withHandler(...)는 function이다. 이 function은 ...
// request method가 POST 가 아니면 res에 에러를 전송한다.
// ...이면, handler를 수행시킨다. handler 수행 시에 catch(error)를
// 할 수 있다.
