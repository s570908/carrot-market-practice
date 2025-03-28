import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import Layout from "@/components/Layout";
import ModButton from "@/components/ModButton";
import MapViewer from "@/components/MapViewer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime, parseId } from "@libs/utils";
import {
  getAppointment,
  updateAppointmentStatus,
  cancelAppointment as cancelAppointmentApi,
} from "@/apiLibs/appointments";
import useUser from "@libs/client/useUser"; // 로그인 유저를 가져오는 훅 추가

export default function AppointmentDetail() {
  const router = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;
  const { user } = useUser(); // 로그인 유저 가져오기
  const [status, setStatus] = useState("");

  // 약속 정보 가져오기
  const { data, error, refetch } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id!),
    enabled: !!id, // id가 존재할 때만 쿼리 실행
  });

  const queryClient = useQueryClient();

  // 약속 상태 변경 뮤테이션
  const { mutate: updateStatus, isPending: updateLoading } = useMutation({
    mutationFn: (newStatus: string) => updateAppointmentStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
    },
  });

  // 약속 취소 뮤테이션 (주최자용)
  const { mutate: cancelAppointment, isPending: cancelLoading } = useMutation({
    mutationFn: () => cancelAppointmentApi(id!, "CANCELLED"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
    },
  });

  useEffect(() => {
    if (data?.appointment && user) {
      // 현재 사용자의 참가 상태 설정
      const currentUserParticipant = data.appointment.participants.find(
        (p: any) => p.user.id === user.id // user.id를 사용하여 로그인 유저 확인
      );
      if (currentUserParticipant) {
        setStatus(currentUserParticipant.status);
      }
    }
  }, [data, user]);

  if (error) return <Layout seoTitle="오류">약속 정보를 불러오는 중 오류가 발생했습니다.</Layout>;
  if (!data) return <Layout seoTitle="로딩 중">약속 정보를 불러오는 중입니다...</Layout>;

  const { appointment, userRole } = data;

  const appointmentStatus = appointment.status;
  const isOrganizer = userRole === "organizer";

  // 참가 상태 변경 처리
  const handleStatusChange = (newStatus: string) => {
    updateStatus(newStatus);
    setStatus(newStatus);
  };

  // 약속 취소 처리
  const handleCancelAppointment = () => {
    if (confirm("정말로 이 약속을 취소하시겠습니까?")) {
      cancelAppointment();
    }
  };

  return (
    <Layout seoTitle={appointment.title} title={appointment.title}>
      <div className="space-y-6">
        {/* 약속 상태 표시 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                appointmentStatus === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : appointmentStatus === "CONFIRMED"
                  ? "bg-green-100 text-green-800"
                  : appointmentStatus === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {appointmentStatus === "PENDING"
                ? "대기중"
                : appointmentStatus === "CONFIRMED"
                ? "확정됨"
                : appointmentStatus === "CANCELLED"
                ? "취소됨"
                : "완료됨"}
            </span>
            {isOrganizer && appointmentStatus !== "CANCELLED" && (
              <ModButton
                onClick={handleCancelAppointment}
                isLoading={cancelLoading}
                variant="danger"
              >
                약속 취소
              </ModButton>
            )}
          </div>

          {!isOrganizer && appointmentStatus === "PENDING" && (
            <div className="flex space-x-2">
              <ModButton
                onClick={() => handleStatusChange("confirmed")}
                isLoading={updateLoading && status === "confirmed"}
                variant={status === "confirmed" ? "primary" : "secondary"}
              >
                수락
              </ModButton>
              <ModButton
                onClick={() => handleStatusChange("declined")}
                isLoading={updateLoading && status === "declined"}
                variant={status === "declined" ? "danger" : "secondary"}
              >
                거절
              </ModButton>
            </div>
          )}
        </div>

        {/* 약속 설명 */}
        {appointment.description && (
          <div className="rounded-md bg-gray-50 p-4">
            <p>{appointment.description}</p>
          </div>
        )}

        {/* 약속 정보 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">날짜 및 시간</h3>
              <p className="mt-1">
                {formatDate(appointment.date)}, {formatTime(appointment.startTime)} -{" "}
                {formatTime(appointment.endTime)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">장소</h3>
              <p className="mt-1 font-medium">{appointment.locationName}</p>
              <p className="text-sm text-gray-600">{appointment.locationAddress}</p>
            </div>

            <div className="h-40 w-full">
              <MapViewer
                lat={appointment.latitude}
                lng={appointment.longitude}
                name={appointment.locationName}
                zoomLevel={appointment.zoomLevel}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">주최자</h3>
              <div className="mt-1 flex items-center">
                {appointment.organizer.avatar ? (
                  <Image
                    src={appointment.organizer.avatar}
                    alt={appointment.organizer.name}
                    className="mr-2 h-8 w-8 rounded-full"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="mr-2 h-8 w-8 rounded-full bg-gray-300"></div>
                )}
                <span>{appointment.organizer.name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                참가자 ({appointment.participants.length}명)
              </h3>
              <ul className="mt-2 divide-y overflow-hidden rounded-md border">
                {appointment.participants.map((participant: any) => (
                  <li key={participant.user.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center">
                      {participant.user.avatar ? (
                        <Image
                          src={participant.user.avatar}
                          alt={participant.user.name}
                          className="mr-2 h-8 w-8 rounded-full"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="mr-2 h-8 w-8 rounded-full bg-gray-300"></div>
                      )}
                      <span>{participant.user.name}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        participant.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : participant.status === "declined"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {participant.status === "confirmed"
                        ? "수락"
                        : participant.status === "declined"
                        ? "거절"
                        : "대기중"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {appointment.notifications.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">알림 설정</h3>
                <ul className="mt-2 space-y-2">
                  {appointment.notifications.map((notification: any) => (
                    <li
                      key={notification.id}
                      className="flex items-center justify-between rounded bg-gray-50 p-2"
                    >
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">
                          {notification.minutesBefore >= 60
                            ? `${Math.floor(notification.minutesBefore / 60)}시간 전`
                            : `${notification.minutesBefore}분 전`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          notification.isSent
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {notification.isSent ? "발송됨" : "대기중"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
