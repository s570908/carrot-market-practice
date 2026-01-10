// libs/server/cleanupExpiredSubscriptions.ts
import client from '@/libs/client/client';

/**
 * 만료된 푸시 구독을 자동으로 정리하는 유틸리티 함수
 * 정기적인 배치 작업이나 특정 이벤트 후에 호출할 수 있음
 */
export async function cleanupExpiredSubscriptions(): Promise<number> {
  try {
    // 30일 이상 된 EXPIRED 구독들을 삭제
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deletedCount = await client.pushSubscription.deleteMany({
      where: {
        status: 'EXPIRED',
        updatedAt: { lt: thirtyDaysAgo }
      }
    });

    console.log(`Cleaned up ${deletedCount.count} expired subscriptions`);
    return deletedCount.count;
  } catch (error) {
    console.error('구독 정리 중 오류:', error);
    return 0;
  }
}

// 매일 자정에 실행하는 cron job (필요시)
// export const scheduleCleanup = () => {
//   schedule.scheduleJob('0 0 * * *', cleanupExpiredSubscriptions);
// };