// libs/server/cleanupExpiredSubscriptions.ts
import client from '@/libs/client/client';

/**
 * 만료된 푸시 구독을 자동으로 정리하는 유틸리티 함수
 * 정기적인 배치 작업이나 특정 이벤트 후에 호출할 수 있음
 */
export async function cleanupExpiredSubscriptions(): Promise<{
  cleaned: number;
  subscriptionIds: number[];
}> {
  try {
    // 만료된 구독 조회
    const expiredSubscriptions = await client.pushSubscription.findMany({
      where: { status: 'EXPIRED' },
      select: { id: true }
    });

    if (expiredSubscriptions.length === 0) {
      return { cleaned: 0, subscriptionIds: [] };
    }

    // 만료된 구독 삭제
    await client.pushSubscription.deleteMany({
      where: { status: 'EXPIRED' }
    });

    return {
      cleaned: expiredSubscriptions.length,
      subscriptionIds: expiredSubscriptions.map(s => s.id)
    };
  } catch (error) {
    console.error('자동 구독 정리 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 일정 시간 이상 지난 만료 구독을 정리하는 함수
 * (예: 30일 이상 지난 만료 구독만 삭제)
 */
export async function cleanupOldExpiredSubscriptions(
  daysOld: number = 30
): Promise<{ cleaned: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await client.pushSubscription.deleteMany({
      where: {
        status: 'EXPIRED',
        updatedAt: {
          lt: cutoffDate
        }
      }
    });

    return { cleaned: result.count };
  } catch (error) {
    console.error(`${daysOld}일 이상 지난 만료 구독 정리 중 오류:`, error);
    throw error;
  }
}