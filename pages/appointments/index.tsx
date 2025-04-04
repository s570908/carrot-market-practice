// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\appointments\index.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import ModButton from "@/components/ModButton";
import { useQuery } from "@tanstack/react-query";
import { getAppointments } from "@/apiLibs/appointments";

// 날짜 포맷 함수
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

// 시간 포맷 함수
const formatTime = (timeStr: string) => {
  const time = new Date(timeStr);
  return time.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });
};

export default function AppointmentList() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "organized" | "participating">("all");

  // 약속 목록 가져오기
  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["appointments", tab],
    queryFn: () => getAppointments(tab),
    staleTime: 60000, // 1분 동안 캐시 데이터 유지 (필요에 따라 조정)
  });
  console.log("AppointmentList: data: ", data);

  // 날짜별로 약속 그룹화
  const groupAppointmentsByDate = (appointments: any[]) => {
    return appointments.reduce((groups: any, appointment: any) => {
      const date = appointment.date.split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {});
  };

  // 상태별 배지 스타일
  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusMap[status]}`}>
        {status === "PENDING"
          ? "대기중"
          : status === "CONFIRMED"
          ? "확정됨"
          : status === "CANCELLED"
          ? "취소됨"
          : "완료됨"}
      </span>
    );
  };

  // 약속 목록 렌더링
  const renderAppointments = () => {
    if (loading) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">약속 정보를 불러오는 중입니다...</p>
        </div>
      );
    }

    if (!data || !data.ok) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">약속 정보를 불러오는데 실패했습니다.</p>
          <ModButton onClick={() => refetch()} className="mt-2">
            다시 시도
          </ModButton>
        </div>
      );
    }

    let appointments: any[] = [];

    if (tab === "all") {
      if (Array.isArray(data.appointments)) {
        appointments = data.appointments;
      } else {
        appointments = [
          ...(data.appointments.organized || []),
          ...(data.appointments.participating || []),
        ];
      }
    } else {
      appointments = Array.isArray(data.appointments)
        ? data.appointments
        : [...(data.appointments.organized || []), ...(data.appointments.participating || [])];
    }

    if (appointments.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">약속이 없습니다.</p>
        </div>
      );
    }

    const groupedAppointments = groupAppointmentsByDate(appointments);
    const sortedDates = Object.keys(groupedAppointments).sort();

    return (
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="overflow-hidden rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-2">
              <h3 className="font-medium">{formatDate(date)}</h3>
            </div>
            <ul className="divide-y">
              {groupedAppointments[date].map((appointment: any) => (
                <li key={appointment.id}>
                  <Link href={`/appointments/${appointment.id}`}>
                    <div className="cursor-pointer p-4 transition hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{appointment.title}</h4>
                          <p className="text-sm text-gray-600">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{appointment.locationName}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          {getStatusBadge(appointment.status)}
                          <p className="mt-1 text-xs text-gray-500">
                            참석자: {appointment.participants?.length || 0}명
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout title="내 약속" seoTitle="내 약속">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setTab("all")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setTab("organized")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === "organized" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              내가 만든 약속
            </button>
            <button
              onClick={() => setTab("participating")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === "participating" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              참여 약속
            </button>
          </div>

          <Link href="/appointments/create" legacyBehavior={false}>
            <ModButton variant="primary">약속 만들기</ModButton>
          </Link>
        </div>

        {renderAppointments()}
      </div>
    </Layout>
  );
}
