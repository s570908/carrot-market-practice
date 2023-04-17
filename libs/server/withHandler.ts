import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
type MethodType = "GET" | "POST" | "DELETE";
export interface ResponseType {
  ok: boolean;
  [key: string]: any | undefined;
}
interface ConfigType {
  methods: MethodType[];
  handler: NextApiHandler;
  isPrivate?: boolean;
}
type HandlerType = {
  (config: ConfigType): NextApiHandler;
};

// 주어진 method에 한해서 fn을 수행하는 새로운 function을 정의해 준다.
// 조건을 위배할 시에는 error로 예외처리를 해준다.
const withHandler: HandlerType = ({ methods, handler, isPrivate = true }) => {
  // 우리가 NexJS에서 실행할 함수를 return해야 합니다.
  return async function (req: NextApiRequest, res: NextApiResponse<ResponseType>) {
    if (req.method && !methods.includes(req.method as MethodType)) {
      // methods가 req.method를 포함하고 있어야 한다. 그렇지 않으면 에러.
      return res.status(405).end();
    }
    if (isPrivate && !req.session.user) {
      return res.status(401).json({ ok: false, error: "Please log in." });
    }
    // login user만이 사용하기를 원하는데 login user session이 존재하지 않는다면 error!
    // login user만이 사용되기를 원하다면 isPrivate은 true이다.
    // login user 가 request할 경우 반드시 req.session.user가 존재하여야 한다.
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        res.status(500).json({ ok: false, error: error.message });
      } else {
        res.status(500).json({ ok: false, error: "Internal Server Error" });
      }
    }
  };
};

export default withHandler;
