import { useState } from "react";
import { AppointmentStatus, ParticipantStatus } from "@prisma/client"; // ParticipantStatus도 import
import ModButton, { ButtonVariant } from "@/components/ModButton";
import { statusText } from "@/types";

interface StatusChangeProps {
  currentStatus: AppointmentStatus;
  isOrganizer: boolean;
  isParticipant: boolean;
  onChangeStatus: (newStatus: AppointmentStatus, participantStatus?: ParticipantStatus) => void; // 수정된 인터페이스
  isLoading?: boolean;
  participantStatus?: ParticipantStatus; // string에서 ParticipantStatus로 변경
}

export default function AppointmentStatusChanger({
  currentStatus,
  isOrganizer,
  isParticipant,
  onChangeStatus,
  isLoading = false,
  participantStatus = ParticipantStatus.PENDING, // Enum 값으로 기본값 설정
}: StatusChangeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 현재 상태에 따라 사용 가능한 상태 변경 옵션 결정
  const getAvailableStatusOptions = () => {
    // 주최자인 경우
    if (isOrganizer) {
      switch (currentStatus) {
        case "PENDING":
          return ["CONFIRMED", "CANCELLED"];
        case "CONFIRMED":
          return ["COMPLETED", "CANCELLED"];
        case "CANCELLED":
          return ["PENDING"];
        case "COMPLETED":
          return ["CONFIRMED"];
        default:
          return [];
      }
    }
    // 참가자인 경우
    else if (isParticipant) {
      if (currentStatus === "PENDING") {
        return ["CONFIRMED", "CANCELLED"]; // 수락 또는 거절
      }
      return [];
    }

    return [];
  };

  const options = getAvailableStatusOptions();

  const buttonVariants: Record<AppointmentStatus, ButtonVariant> = {
    PENDING: "secondary",
    CONFIRMED: "primary",
    CANCELLED: "danger",
    COMPLETED: "primary",
  };

  // 상태별 설명 텍스트 추가
  const statusDescriptions = {
    PENDING: {
      title: "대기 중인 약속입니다",
      description: "참가자들이 수락하기를 기다리는 상태입니다.",
    },
    CONFIRMED: {
      title: "확정된 약속입니다",
      description: "약속 일정이 확정되었습니다. 참가자들에게 알림이 전송됩니다.",
    },
    CANCELLED: {
      title: "취소된 약속입니다",
      description: "이 약속은 취소되었습니다. 모든 참가자에게 취소 알림이 전송됩니다.",
    },
    COMPLETED: {
      title: "완료된 약속입니다",
      description: "약속이 성공적으로 완료되었습니다.",
    },
  };

  // 상태 변경 시 확인 대화상자를 표시하는 함수
  const handleStatusChange = (newStatus: AppointmentStatus) => {
    // 상태 변경 전에 확인 메시지 설정
    let confirmMessage = `약속을 "${statusText[newStatus]}" 상태로 변경하시겠습니까?`;

    // 참가자 응답 상태 처리 (실제 내부적으로는 ParticipantStatus 사용)
    if (isParticipant && !isOrganizer) {
      // 참가자가 거절하는 경우 (내부적으로 ParticipantStatus.DECLINED 사용)
      if (newStatus === "CANCELLED") {
        confirmMessage = "이 약속에 참여하지 않겠습니까?";
      }
      // 참가자가 수락하는 경우 (내부적으로 ParticipantStatus.ACCEPTED 사용)
      else if (newStatus === "CONFIRMED") {
        confirmMessage = "이 약속에 참여하시겠습니까?";
      }
    }
    // 주최자의 경우 기존 메시지에 설명 추가
    else if (isOrganizer) {
      confirmMessage += `\n\n${statusDescriptions[newStatus].description}`;
    }

    // 상태 변경 확인
    const isConfirmed = window.confirm(confirmMessage);

    if (isConfirmed) {
      // 참가자 응답인 경우 적절한 ParticipantStatus를 사용하도록 매핑
      if (isParticipant && !isOrganizer) {
        // UI에서는 AppointmentStatus 값을 사용하지만,
        // 백엔드 API 호출에서는 참가자 상태를 ParticipantStatus로 매핑
        const participantStatusMap: Record<AppointmentStatus, ParticipantStatus> = {
          CONFIRMED: ParticipantStatus.ACCEPTED,
          CANCELLED: ParticipantStatus.DECLINED,
          PENDING: ParticipantStatus.PENDING,
          COMPLETED: ParticipantStatus.ACCEPTED, // 일반적으로 참가자는 COMPLETED 상태를 설정하지 않음
        };

        // 두 번째 인자로 매핑된 참가자 상태를 전달
        onChangeStatus(newStatus, participantStatusMap[newStatus]);

        console.log(
          `참가자가 ${newStatus} 응답함 (내부적으로 ${participantStatusMap[newStatus]} 사용)`
        );
      } else {
        // 주최자인 경우 두 번째 인자 없이 호출
        onChangeStatus(newStatus);
      }
    }
  };

  const handleEditAppointment = () => {
    // 약속 수정 로직 추가
    console.log("Edit appointment");
  };

  const handleDeleteAppointment = () => {
    // 약속 삭제 로직 추가
    console.log("Delete appointment");
  };

  // 상태 변경이 불가능한 경우
  if (options.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 px-4 py-2">
        <p className="text-sm text-gray-600">현재 상태: {statusText[currentStatus]}</p>
      </div>
    );
  }

  // 참가자가 이미 응답한 상태인지 확인
  const hasResponded =
    isParticipant && !isOrganizer && participantStatus !== ParticipantStatus.PENDING;

  return (
    <div className="w-full">
      {/* 현재 상태에 대한 설명 */}
      <div className="mb-4 rounded-md bg-gray-50 p-3">
        <h4 className="mb-1 font-medium text-gray-700">
          {statusDescriptions[currentStatus].title}
        </h4>
        <p className="text-sm text-gray-500">{statusDescriptions[currentStatus].description}</p>

        {/* 참가자의 응답 상태 표시 */}
        {isParticipant && !isOrganizer && (
          <p className="mt-2 text-sm font-medium">
            내 응답 상태:
            <span
              className={`ml-1 ${
                participantStatus === ParticipantStatus.ACCEPTED
                  ? "text-green-600"
                  : participantStatus === ParticipantStatus.DECLINED
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {participantStatus === ParticipantStatus.ACCEPTED
                ? "참여 수락함"
                : participantStatus === ParticipantStatus.DECLINED
                ? "참여 거절함"
                : "응답 대기중"}
            </span>
          </p>
        )}
      </div>

      {/* 상태 변경 버튼들을 그리드로 배치 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* 확정하기/수락하기 버튼 - 참가자일 경우 "수락하기"로 텍스트 변경 */}
        {options.includes("CONFIRMED") && ( // "ACCEPTED"에서 "CONFIRMED"로 변경
          <ModButton
            onClick={() => handleStatusChange("CONFIRMED")} // "ACCEPTED"에서 "CONFIRMED"로 변경
            variant="primary"
            // 여기가 수정된 부분 - 이미 수락된 상태에서는 로딩 스피너를 표시하지 않도록 함
            isLoading={
              isParticipant && !isOrganizer && participantStatus === ParticipantStatus.ACCEPTED
                ? false
                : isLoading
            }
            size="small"
            className={`flex items-center justify-center gap-1 ${
              isParticipant && !isOrganizer && participantStatus === ParticipantStatus.ACCEPTED
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            disabled={
              isParticipant && !isOrganizer && participantStatus === ParticipantStatus.ACCEPTED
            }
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>
              {isParticipant && !isOrganizer
                ? participantStatus === ParticipantStatus.ACCEPTED
                  ? "수락됨"
                  : "수락하기"
                : "확정하기"}
            </span>
          </ModButton>
        )}

        {/* 수정하기 버튼 - 항상 표시 */}
        {isOrganizer && (
          <ModButton
            onClick={handleEditAppointment}
            variant="light"
            size="small"
            className="flex items-center justify-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>수정하기</span>
          </ModButton>
        )}

        {/* 취소하기/거절하기 버튼 - 레이블 명확화 */}
        {options.includes("CANCELLED") && (
          <ModButton
            onClick={() => handleStatusChange("CANCELLED")}
            variant="danger"
            isLoading={isLoading}
            size="small"
            className={`flex items-center justify-center gap-1 ${
              isParticipant && !isOrganizer && participantStatus === ParticipantStatus.DECLINED
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            disabled={
              isParticipant && !isOrganizer && participantStatus === ParticipantStatus.DECLINED
            }
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>
              {isParticipant && !isOrganizer
                ? participantStatus === ParticipantStatus.PENDING
                  ? "거절하기"
                  : participantStatus === ParticipantStatus.DECLINED
                  ? "거절됨"
                  : "수락취소"
                : "취소하기"}
            </span>
          </ModButton>
        )}

        {/* 삭제하기 버튼 - 마지막에 배치 */}
        {isOrganizer && (
          <ModButton
            onClick={handleDeleteAppointment}
            variant="danger"
            isLoading={isLoading}
            size="small"
            className="flex items-center justify-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>삭제하기</span>
          </ModButton>
        )}
      </div>
    </div>
  );
}
