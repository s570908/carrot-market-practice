import { useMemo } from "react";
import { motion } from "framer-motion";
import { ParticipantStatus } from "@prisma/client";

// 참가자 타입 정의
interface Participant {
  user: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  status: string; // 실제 데이터에서는 문자열로 저장되어 있음
}

interface ParticipantResponseSummaryProps {
  participants: Participant[]; // any[] 대신 구체적인 타입 사용
  isOrganizer: boolean;
}

export default function ParticipantResponseSummary({
  participants,
  isOrganizer,
}: ParticipantResponseSummaryProps) {
  const stats = useMemo(() => {
    const total = participants.length;
    // DB에 저장된 값이 "CONFIRMED"이지만 Prisma 타입은 "ACCEPTED"로 정의되어 있음을 고려
    const confirmed = participants.filter((p) => p.status === ParticipantStatus.ACCEPTED).length;
    const declined = participants.filter((p) => p.status === ParticipantStatus.DECLINED).length;
    const pending = participants.filter((p) => p.status === ParticipantStatus.PENDING).length;

    const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    return { total, confirmed, declined, pending, confirmRate };
  }, [participants]);

  // 참석률에 따른 추천 조치 메시지
  const getActionMessage = () => {
    if (!isOrganizer) return null;

    if (stats.confirmRate === 100) {
      return "모든 참가자가 수락했습니다. 약속을 확정해 보세요.";
    } else if (stats.confirmRate >= 75) {
      return "대부분의 참가자가 수락했습니다. 약속을 확정할 수 있습니다.";
    } else if (stats.declined > stats.confirmed) {
      return "거절한 참가자가 많습니다. 일정을 조정하는 것이 좋겠습니다.";
    } else if (stats.pending === stats.total) {
      return "아직 응답한 참가자가 없습니다. 알림을 보내보세요.";
    }

    return "참가자들의 응답을 기다리는 중입니다.";
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-medium">참가자 응답 현황</h3>

      {/* 진행률 표시 */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-sm">
          <span>
            응답률: {stats.total - stats.pending}/{stats.total}
          </span>
          <span className="font-medium">수락률: {stats.confirmRate}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="flex h-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
              className="bg-green-500"
              transition={{ duration: 0.5 }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.declined / stats.total) * 100}%` }}
              className="bg-red-500"
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-green-50 p-2">
          <div className="text-lg font-bold text-green-700">{stats.confirmed}</div>
          <div className="text-xs text-green-600">수락</div>
        </div>
        <div className="rounded-md bg-yellow-50 p-2">
          <div className="text-lg font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-yellow-600">대기중</div>
        </div>
        <div className="rounded-md bg-red-50 p-2">
          <div className="text-lg font-bold text-red-700">{stats.declined}</div>
          <div className="text-xs text-red-600">거절</div>
        </div>
      </div>

      {/* 추천 조치 */}
      {getActionMessage() && (
        <div className="text-sm text-gray-600">
          <p className="rounded-md bg-blue-50 p-2 text-blue-700">💡 {getActionMessage()}</p>
        </div>
      )}
    </div>
  );
}
