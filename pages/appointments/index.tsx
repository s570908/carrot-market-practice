// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\appointments\index.tsx
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { getAppointments } from "@/apiLibs/appointments";
import { AppointmentStatus } from "@prisma/client";
import Link from "next/link";
import ModButton from "@/components/ModButton";
import EmptyState from "@components/EmptyState";
import AppointmentCard from "@components/appointments/AppointmentCard";
import AppointmentStatusFilter from "@components/appointments/AppointmentStatusFilter";
import { formatDate, formatTime } from "@libs/utils";
import dayjs from "dayjs";
import useSocket from "@libs/client/useSocket"; // useSocket 훅 임포트
import useUser from "@libs/client/useUser";

export default function AppointmentList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "organized" | "participating">("all");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "title" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { user } = useUser();

  // useSocket 훅 사용하여 소켓 연결
  const [socket, connected] = useSocket("market");

  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["appointments", activeTab],
    queryFn: () => getAppointments(activeTab),
    staleTime: 1000 * 60, // 1분
  });

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!user?.id || !connected || !socket) return;

    // 개인 룸 접속
    socket.emit("joinRoom", { room: `user-${user.id}` });

    // 약속 목록 업데이트 이벤트 수신 처리
    socket.on("appointment_list_update", (data) => {
      console.log("약속 목록 업데이트 이벤트 수신:", data);

      // 데이터 갱신
      refetch();
    });

    return () => {
      if (socket) {
        socket.off("appointment_list_update");
      }
    };
  }, [refetch, user?.id, connected, socket]);

  // 약속 데이터 정렬 및 필터링
  const processedAppointments = useMemo(() => {
    if (!data) return [];

    let appointments: any[] = [];
    if (activeTab === "all") {
      appointments = [...(data.organized || []), ...(data.participating || [])];
    } else if (activeTab === "organized") {
      appointments = data.organized || [];
    } else {
      appointments = data.participating || [];
    }

    // 상태 필터링 적용
    if (statusFilter !== "ALL") {
      appointments = appointments.filter((apt) => apt.status === statusFilter);
    }

    // 배열 복사 후 정렬
    return [...appointments].sort((a, b) => {
      // 시작 시간이 없거나 온종일 예약 항목은 앞에 배치
      if (!a.startTime || a.allDay) return -1;
      if (!b.startTime || b.allDay) return 1;

      switch (sortBy) {
        case "date": {
          // 날짜와 시간을 결합하여 비교
          const dateTimeA = new Date(
            `${dayjs(a.date).format("YYYY-MM-DD")}T${dayjs(a.startTime).format("HH:mm:ss")}`
          ).getTime();
          const dateTimeB = new Date(
            `${dayjs(b.date).format("YYYY-MM-DD")}T${dayjs(b.startTime).format("HH:mm:ss")}`
          ).getTime();

          return sortOrder === "asc" ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
        }
        case "title": {
          const titleA = a.title?.toLowerCase() || "";
          const titleB = b.title?.toLowerCase() || "";
          return sortOrder === "asc" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
        }
        case "status": {
          const statusA = a.status?.toLowerCase() || "";
          const statusB = b.status?.toLowerCase() || "";
          return sortOrder === "asc"
            ? statusA.localeCompare(statusB)
            : statusB.localeCompare(statusA);
        }
        default:
          return 0;
      }
    });
  }, [data, activeTab, statusFilter, sortBy, sortOrder]);

  return (
    <Layout title="약속 목록" seoTitle="약속 목록 | Carrot Market">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-medium">약속 목록</h1>
          <div className="flex items-center space-x-2">
            <Link
              href="/appointments/calendar"
              className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 transition-colors hover:bg-gray-100"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </Link>
            {/* ModButton을 직접 사용하고 onClick으로 라우팅 처리 */}
            <ModButton
              variant="primary"
              size="small"
              onClick={() => router.push("/appointments/create")}
            >
              약속 만들기
            </ModButton>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`mr-4 py-2 ${
              activeTab === "all"
                ? "border-b-2 border-orange-500 font-medium text-orange-500"
                : "text-gray-500"
            }`}
          >
            모든 약속
          </button>
          <button
            onClick={() => setActiveTab("organized")}
            className={`mr-4 py-2 ${
              activeTab === "organized"
                ? "border-b-2 border-orange-500 font-medium text-orange-500"
                : "text-gray-500"
            }`}
          >
            내가 만든 약속
          </button>
          <button
            onClick={() => setActiveTab("participating")}
            className={`py-2 ${
              activeTab === "participating"
                ? "border-b-2 border-orange-500 font-medium text-orange-500"
                : "text-gray-500"
            }`}
          >
            참여 중인 약속
          </button>
        </div>

        {/* 정렬 컨트롤 추가 */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "title" | "status")}
              className="min-w-[85px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="date">날짜순</option>
              <option value="title">제목순</option>
              <option value="status">상태별</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="flex min-w-[100px] flex-row items-center justify-center gap-1 rounded-lg  border border-gray-300 px-0 py-2 text-sm hover:bg-gray-50"
            >
              <span>{sortOrder === "asc" ? "오름차순" : "내림차순"}</span>
              <svg
                className={`h-4 w-4 transform transition-transform ${
                  sortOrder === "desc" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>
          <AppointmentStatusFilter selectedStatus={statusFilter} onChange={setStatusFilter} />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
          </div>
        ) : processedAppointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                id={appointment.id}
                title={appointment.title}
                startTime={new Date(appointment.startTime)}
                endTime={new Date(appointment.endTime)}
                status={appointment.status}
                location={
                  appointment.locationTmap?.locationName || appointment.locationTmap?.fullAddress
                }
                organizerName={appointment.organizer?.name}
                organizerAvatar={
                  appointment.organizer?.avatar
                    ? `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${appointment.organizer.avatar}/public`
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState message="약속이 없습니다." />
        )}
      </div>
    </Layout>
  );
}
