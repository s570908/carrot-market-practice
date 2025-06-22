// pages/api/push/cleanup-expired.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/libs/client/client';

/**
 * 만료된 푸시 구독을 정리하는 엔드포인트
 * 실행 방법: GET /api/push/cleanup-expired?key=관리자키
 * 
 * 관리자만 접근할 수 있도록 간단한 인증을 추가했습니다.
 * 보안을 강화하려면 미들웨어나 적절한 인증 메커니즘을 구현하세요.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 간단한 보안 조치 - 실제 환경에서는 더 강력한 인증을 사용하세요
  const adminKey = process.env.ADMIN_API_KEY || 'admin-secret-key';
  if (req.query.key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 데이터베이스에서 EXPIRED 상태의 구독 모두 조회
    const expiredSubscriptions = await client.pushSubscription.findMany({
      where: { status: 'EXPIRED' },
      select: { id: true, endpoint: true }
    });

    // 만료된 구독 개수가 0개인 경우
    if (expiredSubscriptions.length === 0) {
      return res.status(200).json({
        ok: true,
        message: '정리할 만료된 구독이 없습니다.',
        cleaned: 0
      });
    }

    // 만료된 구독 전체 삭제
    // 선택사항: 삭제 대신 특별한 상태로 변경하거나 별도 테이블에 보관할 수도 있습니다
    const result = await client.pushSubscription.deleteMany({
      where: { status: 'EXPIRED' }
    });

    return res.status(200).json({
      ok: true,
      message: `${result.count}개의 만료된 구독을 성공적으로 정리했습니다.`,
      cleaned: result.count,
      subscriptions: expiredSubscriptions.map(s => ({ 
        id: s.id,
        endpoint: s.endpoint.substring(0, 30) + '...' // 보안을 위해 전체 URL 대신 일부만 표시
      }))
    });
  } catch (error) {
    console.error('구독 정리 중 오류 발생:', error);
    return res.status(500).json({
      ok: false,
      error: '만료된 구독을 정리하는 도중 오류가 발생했습니다.'
    });
  }
}