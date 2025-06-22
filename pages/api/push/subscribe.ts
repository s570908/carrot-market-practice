import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@libs/client/client';
import { withApiSession } from '@libs/server/withSession';
import withHandler from '@libs/server/withHandler';

// // 엔드포인트 패턴 추출 함수
// // 웹 푸시 구독 엔드포인트에서 고유 식별자를 제외한 기본 패턴을 추출하는 기능을 합니다.
// function getEndpointPattern(endpoint: string): string {
//   try {
//     // FCM 패턴
//     if (endpoint.includes('/fcm/send/')) {
//       return endpoint.split('/fcm/send/')[0] + '/fcm/send/';
//     } 
//     // 일반 URL 패턴
//     const url = new URL(endpoint);
//     return `${url.protocol}//${url.hostname}${url.pathname.split('/').slice(0, -1).join('/')}/`;
//   } catch (e) {
//     return endpoint;
//   }
// }

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // VAPID 키 제공 (GET 요청)
  if (req.method === 'GET') {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return res.status(500).json({ ok: false, error: "VAPID 키가 설정되지 않았습니다" });
    }
    return res.json({ ok: true, publicKey: vapidPublicKey });
  }
  
  // 구독 등록 (POST 요청)
  if (req.method === 'POST') {
    const {
      body: { endpoint, p256dh, auth, browserId, subscription },
      session: { user }
    } = req;

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: '로그인이 필요합니다.' });
    }

    // 두 가지 입력 형식 지원 (개별 필드 또는 subscription 객체)
    let endpointValue, p256dhValue, authValue;
    
    if (subscription) {
      // subscription 객체 형식 사용
      endpointValue = subscription.endpoint;
      p256dhValue = subscription.keys?.p256dh;
      authValue = subscription.keys?.auth;
    } else {
      // 개별 필드 형식 사용
      endpointValue = endpoint;
      p256dhValue = p256dh;
      authValue = auth;
    }

    if (!endpointValue || !p256dhValue || !authValue) {
      return res.status(400).json({ ok: false, error: '필수 정보가 누락되었습니다.' });
    }

    try {
      //const endpointPattern = getEndpointPattern(endpointValue);
      
      // 기존 구독 검색 (정확한 엔드포인트)
      const existingSubscription = await client.pushSubscription.findFirst({
        where: {
          userId: user.id,
          endpoint: endpointValue
        }
      });
      
      let updatedSubscription;
      
      if (existingSubscription) {
        // 기존 구독 업데이트
        updatedSubscription = await client.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            p256dh: p256dhValue,
            auth: authValue,
            browserId
          }
        });
        
        console.log(`기존 구독 업데이트: 사용자 ${user.id}, 엔드포인트: ${endpointValue.substring(0, 30)}...`);
      } else {
        // 새 구독 생성
        updatedSubscription = await client.pushSubscription.create({
          data: {
            userId: user.id,
            endpoint: endpointValue,
            p256dh: p256dhValue,
            auth: authValue,
            browserId
          }
        });
        console.log(`새 구독 생성: 사용자 ${user.id}, 엔드포인트: ${endpointValue.substring(0, 30)}...`);
      }

      return res.status(200).json({
        ok: true,
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('푸시 구독 저장 중 오류:', error);
      return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다.' });
    }
  }
  
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

export default withApiSession(
  withHandler({
    methods: ['GET', 'POST'],
    handler,
    isPrivate: true
  })
);
