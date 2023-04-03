import { NextApiRequest, NextApiResponse } from "next";

// 주어진 method에 한해서 fn을 수행하는 새로운 function을 정의해 준다.
// 조건을 위배할 시에는 error로 예외처리를 해준다.
export default function withHandler(
  method: "GET" | "POST" | "DELETE",
  fn: (req: NextApiRequest, res: NextApiResponse) => void
) {
  // 우리가 NexJS에서 실행할 함수를 return해야 합니다.
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== method) {
      res.status(405).end;
    }
    try {
      await fn(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }
  };
}
