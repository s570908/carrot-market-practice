// pages/api/cron/cleanup-subscriptions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupExpiredSubscriptions, cleanupOldExpiredSubscriptions } from '@/libs/server/cleanupExpiredSubscriptions';

/**
 * 이 엔드포인트는 크론 작업에서 호출하여 만료된 구독을 자동으로 정리할 수 있습니다.
 * 
 * 예시 설정:
 * - Vercel Cron 또는 외부 서비스(예: cron-job.org)에서 이 엔드포인트를 주기적으로 호출
 * - 권장 실행 빈도: 1일 1회 (트래픽이 많으면 더 자주)
 * 
 * 보안:
 * - 여기서는 간단한 API 키 인증을 사용하지만, 실제 환경에서는 더 강력한 인증이 필요합니다.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 크론 작업의 인증 키 확인
  const cronKey = process.env.CRON_API_KEY || 'cron-secret-key';
  if (req.query.key !== cronKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 기본 정리 작업 (모든 EXPIRED 구독)
    const basicResult = await cleanupExpiredSubscriptions();
    
    // 선택적: 오래된 구독만 정리 (예: 30일 이상 지난 것)
    // 두 작업 중 하나만 수행하거나 둘 다 수행할 수 있음
    const daysToKeep = req.query.days ? parseInt(req.query.days as string) : 30;
    const oldResult = await cleanupOldExpiredSubscriptions(daysToKeep);

    return res.status(200).json({
      ok: true,
      message: '만료된 구독 자동 정리 완료',
      results: {
        allExpired: basicResult,
        oldExpired: oldResult
      }
    });
  } catch (error) {
    console.error('자동 정리 작업 실패:', error);
    return res.status(500).json({
      ok: false,
      error: '만료된 구독 정리 중 오류가 발생했습니다.'
    });
  }
}