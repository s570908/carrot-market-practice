import client from "@/libs/client/client";

async function cleanupExpiredSubscriptions() {
  try {
    // 30일 이상 된 EXPIRED 구독 삭제
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await client.pushSubscription.deleteMany({
      where: {
        status: 'EXPIRED',
        updatedAt: { lt: thirtyDaysAgo }
      }
    });

    console.log(`${result.count}개의 만료된 구독을 정리했습니다.`);

    // 모든 ACTIVE 구독의 상태를 EXPIRED로 변경 (임시 조치)
    const expiredAll = await client.pushSubscription.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'EXPIRED' }
    });

    console.log(`${expiredAll.count}개의 활성 구독을 만료 상태로 변경했습니다.`);
  } catch (error) {
    console.error("구독 정리 중 오류:", error);
  } finally {
    await client.$disconnect();
  }
}

cleanupExpiredSubscriptions();
