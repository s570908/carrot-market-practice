import { AppointmentStatus } from "@prisma/client";

interface TimelineProps {
  currentStatus: AppointmentStatus;
}

export default function AppointmentStatusTimeline({ currentStatus }: TimelineProps) {
  const statuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];

  // 취소된 경우 특별 처리
  if (currentStatus === "CANCELLED") {
    return (
      <div className="py-4">
        <div className="flex w-full items-center justify-center rounded-md bg-red-50 py-3">
          <svg className="mr-2 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-red-800">이 약속은 취소되었습니다</span>
        </div>
      </div>
    );
  }

  // 현재 상태의 인덱스 찾기
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="py-4">
      <div className="relative">
        {/* 연결선 */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gray-200"></div>

        {/* 상태 단계들 */}
        <div className="relative flex justify-between">
          {statuses.map((status, index) => {
            // 현재 단계까지는 활성화, 이후는 비활성화
            const isActive = index <= currentIndex;
            // 현재 단계는 특별 강조
            const isCurrent = status === currentStatus;

            return (
              <div key={status} className="relative flex flex-col items-center">
                {/* 원 표시기 */}
                <div
                  className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 
                    ${isActive ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"} 
                    ${isCurrent ? "ring-4 ring-orange-200" : ""}`}
                >
                  {isActive && (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* 라벨 */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-orange-600" : "text-gray-500"
                    }`}
                  >
                    {status === "PENDING" && "대기중"}
                    {status === "CONFIRMED" && "확정됨"}
                    {status === "COMPLETED" && "완료됨"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
