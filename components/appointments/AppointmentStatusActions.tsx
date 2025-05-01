import { AppointmentStatus } from "@prisma/client";
import ModButton from "@/components/ModButton";
import { useState } from "react";

interface StatusActionsProps {
  status: AppointmentStatus;
  isOrganizer: boolean;
  isParticipant: boolean;
  onChangeStatus: (status: AppointmentStatus) => void;
  onSendReminder: () => void;
  onReschedule: () => void;
  onShare: () => void;
}

export default function AppointmentStatusActions({
  status,
  isOrganizer,
  isParticipant,
  onChangeStatus,
  onSendReminder,
  onReschedule,
  onShare,
}: StatusActionsProps) {
  const [isReminderSent, setIsReminderSent] = useState(false);

  // 상태별 주요 액션 정의
  const getPrimaryAction = () => {
    if (!isOrganizer) return null;

    switch (status) {
      case "PENDING":
        return (
          <ModButton variant="primary" onClick={() => onSendReminder()} className="w-full">
            <div className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              알림 보내기
            </div>
          </ModButton>
        );
      case "CONFIRMED":
        return (
          <ModButton variant="primary" onClick={() => onShare()} className="w-full">
            <div className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              약속 공유하기
            </div>
          </ModButton>
        );
      case "CANCELLED":
        return (
          <ModButton variant="secondary" onClick={() => onReschedule()} className="w-full">
            <div className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              일정 재조정하기
            </div>
          </ModButton>
        );
      case "COMPLETED":
        return (
          <ModButton
            variant="secondary"
            onClick={() => alert("준비 중인 기능입니다.")}
            className="w-full"
          >
            <div className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              약속 후기 작성하기
            </div>
          </ModButton>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 상태에 따른 주요 액션 */}
      {getPrimaryAction()}

      {/* 상태 변경 버튼은 기존 AppointmentStatusChanger 컴포넌트 활용 */}
    </div>
  );
}
