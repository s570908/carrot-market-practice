import Image from "next/image";
import { motion } from "framer-motion";
import { formatDate, formatTime } from "@libs/utils";
import AppointmentStatusBadge from "@components/appointments/AppointmentStatusBadge";
import Link from "next/link";

interface AppointmentCardProps {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  status: any;
  location?: string;
  organizerName?: string;
  organizerAvatar?: string;
}

export default function AppointmentCard({
  id,
  title,
  startTime,
  endTime,
  status,
  location,
  organizerName,
  organizerAvatar,
}: AppointmentCardProps) {
  // 다중일 약속 여부 확인
  const isSameDay = startTime.toDateString() === endTime.toDateString();

  console.log("id, title", id, title);
  console.log("startTime", startTime);
  console.log("endTime", endTime);
  console.log(
    `약속시간: , ${formatDate(startTime)}: ${formatTime(startTime)}-${formatTime(endTime)}`
  );
  return (
    <Link href={`/appointments/${id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="relative p-4">
          {/* 상태 배지 - 우측 상단에 배치 */}
          <div className="absolute right-4 top-4">
            <AppointmentStatusBadge status={status} withAnimation />
          </div>

          {/* 제목 */}
          <h3 className="mb-2 pr-20 text-lg font-medium text-gray-900">{title}</h3>

          {/* 약속 메타 정보 - 기간 약속인 경우 다르게 표시 */}
          <div className="text-sm text-gray-500">
            {!isSameDay ? (
              <div>
                <div className="mb-1 flex items-center text-blue-500">
                  {/* 기간 약속 아이콘 */}
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">기간 약속</span>
                </div>
                <div>
                  시작: {formatDate(startTime)} {formatTime(startTime)}
                </div>
                <div>
                  종료: {formatDate(endTime)} {formatTime(endTime)}
                </div>
              </div>
            ) : (
              <>
                {formatDate(startTime)} {formatTime(startTime)}-{formatTime(endTime)}
              </>
            )}
          </div>

          {/* 위치 정보 */}
          {location && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg
                className="mr-1 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* 주최자 정보 */}
          {organizerName && (
            <div className="mt-3 flex items-center">
              <div className="flex-shrink-0">
                {organizerAvatar ? (
                  <div className="h-6 w-6 overflow-hidden rounded-full">
                    <Image
                      src={organizerAvatar}
                      alt={organizerName}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-9a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 2a1 1 0 0 1-1-1v-3a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1z" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="ml-1.5 text-xs text-gray-500">{organizerName}</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
