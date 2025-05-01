import { AppointmentParticipant, ParticipantStatus } from "@/types";
import ImgComponent from "@components/ImgComponent";

interface AppointmentParticipantsListProps {
  participants: AppointmentParticipant[];
  currentUserId?: number;
  showStatus?: boolean;
}

export default function AppointmentParticipantsList({
  participants,
  currentUserId,
  showStatus = true,
}: AppointmentParticipantsListProps) {
  // statusBadgeClass를 Record 타입으로 정의
  const statusBadgeClass: Record<ParticipantStatus, string> = {
    [ParticipantStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [ParticipantStatus.ACCEPTED]: "bg-green-100 text-green-800",
    [ParticipantStatus.DECLINED]: "bg-red-100 text-red-800",
  };

  // 상태별 텍스트 정의
  const statusText: Record<ParticipantStatus, string> = {
    [ParticipantStatus.DECLINED]: "거절",
    [ParticipantStatus.PENDING]: "대기중",
    [ParticipantStatus.ACCEPTED]: "참여",
  };

  return (
    <div className="max-h-[300px] overflow-y-auto">
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="flex items-center justify-between p-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              {participant.user.avatar ? (
                <ImgComponent
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${participant.user.avatar}/public`}
                  width={40}
                  height={40}
                  clsProps="rounded-full border border-gray-200"
                  imgName={participant.user.name}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{participant.user.name}</p>
                {participant.user.id === currentUserId && (
                  <p className="text-xs text-gray-500">나</p>
                )}
              </div>
            </div>

            {showStatus && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusBadgeClass[participant.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {statusText[participant.status] || participant.status}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
