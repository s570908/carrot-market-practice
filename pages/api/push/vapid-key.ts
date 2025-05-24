import type { NextApiRequest, NextApiResponse } from 'next';
import { getVapidPublicKey } from '@libs/server/pushService';
import { withApiSession } from '@libs/server/withSession';
import withHandler from '@libs/server/withHandler';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // pushService에서 VAPID 공개 키 가져오기
    const vapidPublicKey = getVapidPublicKey();
    
    return res.status(200).json({
      ok: true,
      vapidPublicKey
    });
  } catch (error) {
    console.error('VAPID 키 제공 중 오류:', error);
    return res.status(500).json({
      ok: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

export default withApiSession(
  withHandler({
    methods: ['GET'],
    handler,
    isPrivate: false // 로그인 여부와 상관없이 접근 가능
  })
);
