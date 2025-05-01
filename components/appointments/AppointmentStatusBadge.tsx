import { AppointmentStatus } from "@prisma/client";

// 상태별 배경색, 텍스트 색상, 아이콘 정의
const statusConfig = {
  PENDING: {
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    borderColor: "border-amber-200",
    icon: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  CONFIRMED: {
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    icon: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  CANCELLED: {
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
    icon: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  COMPLETED: {
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
    icon: (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: "small" | "medium" | "large";
  withAnimation?: boolean;
}

export default function AppointmentStatusBadge({
  status,
  size = "medium",
  withAnimation = false,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = {
    small: "text-xs px-2 py-0.5",
    medium: "text-sm px-2.5 py-0.75",
    large: "text-sm px-3 py-1",
  };

  const statusText = {
    PENDING: "대기중",
    CONFIRMED: "확정됨",
    CANCELLED: "취소됨",
    COMPLETED: "완료됨",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border 
        ${config.bgColor} ${config.textColor} ${config.borderColor} 
        ${sizeClasses[size]} font-medium
        ${withAnimation ? "transition-all duration-200 hover:scale-105" : ""}
      `}
    >
      <span className="mr-1.5">{config.icon}</span>
      {statusText[status]}
    </span>
  );
}
