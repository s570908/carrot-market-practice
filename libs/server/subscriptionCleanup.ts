import client from '@libs/client/client';
import { PushSubscriptionStatus } from '@prisma/client';

/**
 * 만료된 푸시 구독을 정리하는 함수
 * 정기적으로 실행하여 DB 정리
 */
export async function cleanupExpiredSubscriptions(): Promise<number> {
  try {
    // 30일 이상 된 구독을 대상으로 정리
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Prisma 스키마에 따라 실제 필드명 사용
    const deleteResult = await client.pushSubscription.deleteMany({
      where: {
        OR: [
          { status: PushSubscriptionStatus.EXPIRED },
          { status: PushSubscriptionStatus.INVALID }
        ],
        updatedAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log(`오래된 구독 ${deleteResult.count}개 정리 완료`);
    return deleteResult.count;
  } catch (error) {
    console.error("구독 정리 중 오류:", error);
    return 0;
  }
}

/**
 * 구독 통계 조회 (단순화된 버전)
 */
export async function getSubscriptionStats() {
  try {
    const totalCount = await client.pushSubscription.count();
    const recentCount = await client.pushSubscription.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7일 이내
        }
      }
    });

    const result = {
      total: totalCount,
      recent: recentCount
    };

    console.log("구독 통계:", result);
    return result;
  } catch (error) {
    console.error("구독 통계 조회 오류:", error);
    return { total: 0, recent: 0 };
  }
}