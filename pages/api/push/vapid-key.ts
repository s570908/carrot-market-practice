import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { getVapidPublicKey } from "@libs/server/pushService";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // VAPID 공개키 반환
    const vapidPublicKey = getVapidPublicKey();
    
    if (!vapidPublicKey) {
      return res.status(500).json({ 
        ok: false, 
        error: "VAPID 공개키가 설정되지 않았습니다." 
      });
    }
    
    return res.status(200).json({ 
      ok: true, 
      vapidPublicKey 
    });
  } catch (error) {
    console.error("VAPID 키 반환 오류:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "서버 오류가 발생했습니다." 
    });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler })
);
