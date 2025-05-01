import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime, parseId } from "@libs/utils";
import {
  getAppointment,
  updateAppointmentStatus,
  cancelAppointment as cancelAppointmentApi,
} from "@/apiLibs/appointments";
import useUser from "@libs/client/useUser";
import MapViewer from "@components/MapViewer";
import EmptyState from "@components/EmptyState";
import ImgComponent from "@components/ImgComponent";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import AppointmentStatusBadge from "@components/appointments/AppointmentStatusBadge";
import AppointmentStatusTimeline from "@components/appointments/AppointmentStatusTimeline";
import AppointmentStatusChanger from "@components/appointments/AppointmentStatusChanger";
import ParticipantResponseSummary from "@/components/ParticipantResponseSummary";
import AppointmentStatusActions from "@components/appointments/AppointmentStatusActions";
import useSocket from "@libs/client/useSocket";
import { AppointmentStatus, ParticipantStatus } from "@prisma/client";
import { AppointmentParticipant, ParticipantStatusChangeEvent } from "@/types";

// 간단한 SVG 아이콘 컴포넌트 정의
const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 h-5 w-5 text-orange-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 h-5 w-5 text-orange-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 h-5 w-5 text-orange-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const NotificationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 h-5 w-5 text-orange-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const UserCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5zM12.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM12 20.25a8.25 8.25 0 0 0 8.25-8.25.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75 5.25 5.25 0 0 1-10.5 0 .75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75 8.25 8.25 0 0 0 8.25 8.25z"
      clipRule="evenodd"
    />
  </svg>
);

// 체크 아이콘 - 간소화된 버전
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-green-600"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.87 12.341a1 1 0 01-1.74 0l-2.5-5a1 1 0 011.74-.98l1.63 3.26 1.63-3.26a1 1 0 111.74.98l-2.5 5z"
      clipRule="evenodd"
    />
  </svg>
);

// 시계 아이콘 - 간소화된 버전
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-gray-400"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
      clipRule="evenodd"
    />
  </svg>
);

export default function AppointmentDetail() {
  const router = useRouter();
  const { id: rawId, from, view } = router.query;
  const id = (rawId !== undefined ? parseId(rawId) : 0) ?? 0;

  const backUrl =
    from === "calendar"
      ? view
        ? `/appointments/calendar?view=${view}`
        : "/appointments/calendar"
      : "/appointments";

  const [socket, connected] = useSocket("market");
  const { user } = useUser();
  const [status, setStatus] = useState<ParticipantStatus | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data, error, refetch } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
    //refetchInterval: 5000, // 5초마다 자동 갱신
  });

  const { mutate: updateStatus, isPending: updateLoading } = useMutation({
    mutationFn: (newStatus: string) => updateAppointmentStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      toast.success("상태가 성공적으로 변경되었습니다.");
    },
    onError: (error) => {
      toast.error(
        `상태 변경 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    },
  });

  const { mutate: cancelAppointment, isPending: cancelLoading } = useMutation({
    mutationFn: () => cancelAppointmentApi(id!, "CANCELLED"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      toast.success("약속이 취소되었습니다.");
    },
    onError: () => {
      toast.error("약속 취소 중 오류가 발생했습니다.");
    },
  });

  const { mutate: deleteAppointment, isPending: deleteLoading } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("삭제 요청 실패");
      return response.json();
    },
    onSuccess: () => {
      toast.success("약속이 삭제되었습니다.");
      router.push("/appointments");
    },
    onError: () => {
      toast.error("약속 삭제 중 오류가 발생했습니다.");
    },
  });

  const appointment = data?.appointment;
  const userRole = data?.userRole;
  console.log(
    "AppointmentDetail--appointment",
    appointment?.locationTmap?.addressInfo?.fullAddress
  );

  // 여기서 한 번만 타입 단언
  const appointmentStatus = (appointment?.status ?? "PENDING") as AppointmentStatus;
  const isOrganizer = userRole === "organizer";

  // 타입 안전한 이벤트 발신 헬퍼 함수 - 타입 변환 추가
  const emitParticipantStatusChange = (newStatus: ParticipantStatus) => {
    if (!socket || !connected || !user || !id) return;

    // Prisma의 ParticipantStatus를 이벤트에 맞는 타입으로 변환
    const convertedStatus: ParticipantStatus =
      newStatus === "ACCEPTED"
        ? ("ACCEPTED" as ParticipantStatus)
        : newStatus === "DECLINED"
        ? ("DECLINED" as ParticipantStatus)
        : ("PENDING" as ParticipantStatus);

    // 타입 안전성이 보장된 이벤트 객체 생성
    const statusChangeEvent: ParticipantStatusChangeEvent = {
      appointmentId: Number(id),
      participantId: user.id,
      participantName: user.name || "알 수 없는 사용자",
      newStatus: convertedStatus, // 변환된 타입 사용
      timestamp: new Date().toISOString(),
    };

    // 타입 안전성이 확보된 이벤트 발신
    socket.emit("participantStatusChanged", statusChangeEvent);
    console.log("이벤트 발신: participantStatusChanged", statusChangeEvent);
  };

  useEffect(() => {
    if (data?.appointment && user) {
      // status가 string으로 올 수 있으므로 타입 단언 필요
      const currentUserParticipant = data.appointment?.participants?.find(
        (p) => p.user.id === user.id
      );
      if (currentUserParticipant) {
        setStatus(currentUserParticipant.status as ParticipantStatus);
      }
    }
  }, [data, user]);

  useEffect(() => {
    if (!user?.id || !connected || !socket || !id) return;

    // 사용자 개인 룸 참여
    socket.emit("joinRoom", { room: `user-${user.id}` });

    // 약속방(appointment room) 조인
    socket.emit("joinAppointmentRoom", {
      appointmentId: id,
      userId: user.id,
      userName: user.name,
    });

    // 참가자 상태 변경 이벤트 수신
    socket.on("participantStatusChanged", (data: ParticipantStatusChangeEvent) => {
      console.log("참가자 상태 변경 이벤트 수신--participantStatusChanged:", data);
      // 알림 표시
      if (isOrganizer) {
        const statusMessage = data.newStatus === "ACCEPTED" ? "수락" : "거절";
        console.log(`${data.participantName}님이 약속을 ${statusMessage}했습니다.`);
        toast.info(`${data.participantName}님이 약속을 ${statusMessage}했습니다.`);
      }
      // 상태가 변경되었으므로 데이터 갱신
      refetch();
    });

    // 약속 업데이트 이벤트 수신
    socket.on("appointmentUpdated", (data) => {
      console.log("약속 업데이트:", data);
      // 현재 사용자가 업데이트한 것이 아닌 경우에만 데이터 갱신
      if (data.updatedBy !== user.id) {
        refetch();
      }
    });

    // userJoinedAppointment 이벤트 리스너 등록
    const handleUserJoined = (data: {
      appointmentId: number;
      userId: number;
      userName: string;
      timestamp: string;
    }) => {
      if (data.userId !== user.id) {
        // 본인이 아닌 다른 참가자가 들어온 경우에만 알림
        toast.info(`${data.userName}님이 약속방에 입장했습니다.`);
      }
    };
    socket.on("userJoinedAppointment", handleUserJoined);

    return () => {
      // 이벤트 리스너 정리
      socket.off("participantStatusChanged");
      socket.off("appointmentUpdated");
      socket.off("userJoinedAppointment", handleUserJoined);

      if (appointmentStatus === "COMPLETED" || appointmentStatus === "CANCELLED") {
        socket.emit("leaveRoom", { room: `appointment-${id}` });
      }

      // 약속방(appointment room) 나가기
      socket.emit("leaveAppointmentRoom", { appointmentId: id });
    };
  }, [user?.id, user?.name, connected, socket, id, appointmentStatus, isOrganizer, refetch]);

  // 주최자를 위한 약속 상태 변경 함수
  const handleOrganizerStatusChange = (newStatus: AppointmentStatus) => {
    console.log("주최자가 약속 상태 변경:", newStatus);

    // CANCELLED 상태는 별도 API를 사용
    if (newStatus === "CANCELLED") {
      handleCancelAppointment();
    } else {
      updateStatus(newStatus);
      // 주최자는 약속 전체 상태를 변경하므로 로컬 상태는 업데이트하지 않음
    }
  };

  // 참가자를 위한 참여 상태 변경 함수
  const handleParticipantStatusChange = (newStatus: ParticipantStatus) => {
    console.log("참가자가 참여 상태 변경:", newStatus);

    // 백엔드 API 호출 (API는 문자열 형태로 상태를 받음)
    updateStatus(newStatus);

    // 로컬 상태 업데이트
    setStatus(newStatus);

    // 타입 안전한 이벤트 발신
    emitParticipantStatusChange(newStatus);
  };

  const handleCancelAppointment = () => {
    if (confirm("정말로 이 약속을 취소하시겠습니까?")) {
      cancelAppointment();
      toast.success(isOrganizer ? "약속이 취소되었습니다." : "참여가 취소되었습니다.");
    }
  };

  const handleEditAppointment = () => {
    router.push(`/appointments/${id}/edit`);
  };

  const handleDeleteAppointment = () => {
    if (confirm("정말로 이 약속을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
      deleteAppointment();
    }
  };

  if (error) return <Layout seoTitle="오류">약속 정보를 불러오는 중 오류가 발생했습니다.</Layout>;
  if (!data) return <Layout seoTitle="로딩 중">약속 정보를 불러오는 중입니다...</Layout>;
  if (!appointment) {
    return <EmptyState message="약속 정보가 없습니다" />;
  }

  return (
    <Layout
      seoTitle={`약속: ${appointment?.title || "상세 정보"}`}
      title={appointment?.title || "약속 상세"}
      canGoBack
      backUrl={backUrl}
    >
      <div className="pb-20">
        <div
          className={`relative mb-6 overflow-hidden rounded-xl p-6 text-white shadow-lg
          ${appointmentStatus === "PENDING" ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : ""}
          ${appointmentStatus === "CONFIRMED" ? "bg-gradient-to-r from-green-400 to-green-600" : ""}
          ${appointmentStatus === "CANCELLED" ? "bg-gradient-to-r from-red-400 to-red-600" : ""}
          ${appointmentStatus === "COMPLETED" ? "bg-gradient-to-r from-blue-400 to-blue-600" : ""}
        `}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white opacity-10"></div>
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white opacity-10"></div>

          <div className="relative z-10">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">{appointment.title}</h1>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <AppointmentStatusBadge status={appointmentStatus} size="medium" />

              <span className="text-sm">
                {new Date(appointment.startTime).toDateString() ===
                new Date(appointment.endTime).toDateString() ? (
                  <>
                    {formatDate(appointment.startTime)}, {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </>
                ) : (
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
                      시작: {formatDate(appointment.startTime)} {formatTime(appointment.startTime)}
                    </div>
                    <div>
                      종료: {formatDate(appointment.endTime)} {formatTime(appointment.endTime)}
                    </div>
                  </div>
                )}
              </span>
            </div>

            {(isOrganizer || (!isOrganizer && appointmentStatus === "PENDING")) && (
              <div className="flex flex-wrap gap-2">
                <AppointmentStatusChanger
                  currentStatus={appointmentStatus}
                  isOrganizer={isOrganizer}
                  isParticipant={!isOrganizer}
                  participantStatus={status} // 참가자의 응답 상태 전달
                  onChangeStatus={(newStatus, participantStatus) => {
                    // 주최자/참가자 분기 처리
                    if (isOrganizer) {
                      // 주최자인 경우 약속 전체 상태 변경
                      handleOrganizerStatusChange(newStatus as AppointmentStatus);
                    } else if (participantStatus) {
                      // 참가자인 경우 자신의 참여 상태만 변경
                      handleParticipantStatusChange(participantStatus);
                    }
                  }}
                  isLoading={updateLoading || cancelLoading}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center space-y-6">
            {/* 참가자 응답 현황 - 모든 사용자에게 표시 */}
            {appointmentStatus === "PENDING" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
              >
                <ParticipantResponseSummary
                  participants={appointment.participants}
                  isOrganizer={isOrganizer}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-3 text-lg font-medium text-gray-800">약속 상태</h2>
              <AppointmentStatusTimeline currentStatus={appointmentStatus} />

              {(isOrganizer || (!isOrganizer && appointmentStatus === "PENDING")) && (
                <div className="mt-4">
                  <AppointmentStatusActions
                    status={appointmentStatus}
                    isOrganizer={isOrganizer}
                    isParticipant={!isOrganizer}
                    onChangeStatus={(newStatus) => {
                      if (isOrganizer) {
                        handleOrganizerStatusChange(newStatus as AppointmentStatus);
                      } else {
                        // 참가자가 AppointmentStatusActions에서 상태 변경 시
                        // 참가자 상태와 약속 상태의 매핑 처리
                        if (newStatus === "CONFIRMED") {
                          handleParticipantStatusChange(ParticipantStatus.ACCEPTED);
                        } else if (newStatus === "CANCELLED") {
                          handleParticipantStatusChange(ParticipantStatus.DECLINED);
                        } else if (newStatus === "PENDING") {
                          handleParticipantStatusChange(ParticipantStatus.PENDING);
                        }
                      }
                    }}
                    onSendReminder={() => {
                      toast.success("참가자들에게 알림이 전송되었습니다.");
                    }}
                    onReschedule={() => {
                      router.push(`/appointments/${id}/edit`);
                    }}
                    onShare={() => {
                      navigator.share?.({
                        title: appointment.title,
                        text: `${formatDate(appointment.startTime)}, ${formatTime(
                          appointment.startTime
                        )}에 약속이 있습니다.`,
                        url: window.location.href,
                      }) || toast.info("공유 기능을 지원하지 않는 브라우저입니다.");
                    }}
                  />
                </div>
              )}
            </motion.div>

            {appointment.description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
              >
                <h2 className="mb-3 text-lg font-medium text-gray-800">약속 설명</h2>
                <p className="whitespace-pre-wrap text-gray-600">{appointment.description}</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center">
                <LocationIcon />
                <h2 className="text-lg font-medium text-gray-800">약속 장소</h2>
              </div>
              {appointment.locationTmap && (
                <>
                  <div className="mb-4 border-2 border-gray-200 p-1">
                    <p className="font-medium text-gray-900">
                      {appointment.locationTmap.locationName}
                    </p>
                    <p className="text-sm text-gray-600 ">
                      {appointment.locationTmap.addressInfo?.fullAddress || "주소 정보 없음"}
                    </p>
                  </div>

                  <div className="w-full overflow-hidden rounded-lg shadow-md">
                    <MapViewer
                      lat={appointment.locationTmap?.latitude ?? 0}
                      lng={appointment.locationTmap?.longitude ?? 0}
                      name={appointment.locationTmap?.locationName ?? ""}
                      zoomLevel={appointment.locationTmap?.zoomLevel ?? 10}
                    />
                  </div>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center">
                <UserIcon />
                <h2 className="text-lg font-medium text-gray-800">주최자</h2>
              </div>

              <div className="flex items-center space-x-3 border-2 border-gray-200 px-2 py-3">
                {appointment.organizer.avatar ? (
                  <ImgComponent
                    imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${appointment.organizer.avatar}/public`}
                    width={48}
                    height={48}
                    clsProps="rounded-full border border-gray-200"
                    imgName={appointment.organizer.name}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                    <UserCircleIcon />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{appointment.organizer.name}</p>
                  <p className="text-sm text-gray-500">{isOrganizer ? "나" : "주최자"}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <UsersIcon />
                  <h2 className="text-lg font-medium text-gray-800">참가자</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {appointment.participants.length}명
                </span>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                <ul className="divide-y divide-gray-100 rounded-lg border-2 border-gray-200">
                  {appointment.participants.map((participant: AppointmentParticipant) => (
                    <li
                      key={participant.user.id}
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
                            <UserCircleIcon />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{participant.user.name}</p>
                          {participant.user.id === user?.id && (
                            <p className="text-xs text-gray-500">나</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          participant.status === ParticipantStatus.ACCEPTED
                            ? "bg-green-100 text-green-800"
                            : participant.status === ParticipantStatus.DECLINED
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {participant.status === ParticipantStatus.ACCEPTED
                          ? "수락"
                          : participant.status === ParticipantStatus.DECLINED
                          ? "거절"
                          : "대기중"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {appointment.notifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center">
                  <NotificationIcon />
                  <h2 className="text-lg font-medium text-gray-800">알림 설정</h2>
                </div>

                <ul className="space-y-3">
                  {appointment.notifications.map((notification: any) => (
                    <li
                      key={notification.id}
                      className="flex items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 p-3 shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{notification.title}</p>
                        <p className="text-sm text-gray-600">
                          {notification.minutesBefore >= 60
                            ? `${Math.floor(notification.minutesBefore / 60)}시간 전`
                            : `${notification.minutesBefore}분 전`}
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          notification.isSent ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        {notification.isSent ? <CheckCircleIcon /> : <ClockIcon />}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
