import { AppointmentStatus } from "@prisma/client";

interface StatusFilterProps {
  selectedStatus: AppointmentStatus | "ALL";
  onChange: (status: AppointmentStatus | "ALL") => void;
}

export default function AppointmentStatusFilter({ selectedStatus, onChange }: StatusFilterProps) {
  const statusOptions = [
    { value: "ALL", label: "전체" },
    { value: "PENDING", label: "대기중" },
    { value: "CONFIRMED", label: "확정됨" },
    { value: "CANCELLED", label: "취소됨" },
    { value: "COMPLETED", label: "완료됨" },
  ];

  return (
    <div className=" flex flex-wrap  gap-1">
      {statusOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value as AppointmentStatus | "ALL")}
          className={`rounded-full px-2 py-1 text-sm font-medium transition-colors ${
            selectedStatus === option.value
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
