import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ModButton from "@/components/ModButton";
import { getAppointments } from "@/apiLibs/appointments";
import AppointmentParticipantsList from "@components/appointments/AppointmentParticipantsList";
import { AppointmentStatus } from "@prisma/client";
import { formatDate, formatTime } from "@libs/utils";
import Link from "next/link";
import EmptyState from "@components/EmptyState";

export default function OrganizerDashboard() {
  // 주최자의 대기중인 약속만 필터링
  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "organized"],
    queryFn: () => getAppointments("organized"),
    refetchInterval: 10000, // 10초마다 갱신
  });

  // 대기중인 약속만 필터링
  const pendingAppointments = data?.organized?.filter((apt) => apt.status === "PENDING") || [];

  return (
    <Layout title="주최자 대시보드" seoTitle="약속 관리 대시보드" canGoBack>
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">약속 관리 대시보드</h1>
          <Link href="/appointments/create">
            <ModButton variant="primary" size="small">
              새 약속 만들기
            </ModButton>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-medium">응답 대기 중인 약속</h2>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
          ) : pendingAppointments.length > 0 ? (
            <div className="space-y-6">
              {pendingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{appointment.title}</h3>
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        대기중
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDate(appointment.date)}, {formatTime(appointment.startTime)} -{" "}
                      {formatTime(appointment.endTime)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">참가자 응답 현황</h4>
                    <AppointmentParticipantsList participants={appointment.participants} />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Link href={`/appointments/${appointment.id}`}>
                      <ModButton variant="secondary" size="small">
                        상세 보기
                      </ModButton>
                    </Link>
                    <ModButton
                      variant="primary"
                      size="small"
                      onClick={() => {
                        // 알림 보내기 로직 구현
                        alert("참가자들에게 알림이 전송되었습니다.");
                      }}
                    >
                      알림 보내기
                    </ModButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="응답 대기 중인 약속이 없습니다." />
          )}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-medium">약속 통계</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => {
              const count = data?.organized?.filter((apt) => apt.status === status).length || 0;
              const statusColors: Record<string, string> = {
                PENDING: "bg-yellow-100 text-yellow-800",
                CONFIRMED: "bg-green-100 text-green-800",
                COMPLETED: "bg-blue-100 text-blue-800",
                CANCELLED: "bg-red-100 text-red-800",
              };
              const statusLabels: Record<string, string> = {
                PENDING: "대기중",
                CONFIRMED: "확정됨",
                COMPLETED: "완료됨",
                CANCELLED: "취소됨",
              };

              return (
                <div key={status} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}
                  >
                    {statusLabels[status]}
                  </div>
                  <p className="mt-2 text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500">약속</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
