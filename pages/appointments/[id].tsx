import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import ModButton from "@/components/ModButton";
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

export default function AppointmentDetail() {
  const router = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;
  const { user } = useUser();
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  const { data, error, refetch } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  });

  const { mutate: updateStatus, isPending: updateLoading } = useMutation({
    mutationFn: (newStatus: string) => updateAppointmentStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
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

  useEffect(() => {
    if (data?.appointment && user) {
      const currentUserParticipant = data.appointment?.participants?.find(
        (p: any) => p.user.id === user.id
      );
      if (currentUserParticipant) {
        setStatus(currentUserParticipant.status);
      }
    }
  }, [data, user]);

  if (error) return <Layout seoTitle="오류">약속 정보를 불러오는 중 오류가 발생했습니다.</Layout>;
  if (!data) return <Layout seoTitle="로딩 중">약속 정보를 불러오는 중입니다...</Layout>;

  const appointment = data?.appointment;
  const userRole = data?.userRole;
  if (!appointment) {
    return <EmptyState message="약속 정보가 없습니다" />;
  }

  const appointmentStatus = appointment?.status;
  const isOrganizer = userRole === "organizer";

  const handleStatusChange = (newStatus: string) => {
    updateStatus(newStatus);
    setStatus(newStatus);
  };

  const handleCancelAppointment = () => {
    if (confirm("정말로 이 약속을 취소하시겠습니까?")) {
      cancelAppointment();
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

  return (
    <Layout
      seoTitle={`약속: ${appointment?.title || "상세 정보"}`}
      title={appointment?.title || "약속 상세"}
      canGoBack
    >
      <div className="pb-20">
        <div className="relative p-6 mb-6 overflow-hidden text-white shadow-lg rounded-xl bg-gradient-to-r from-orange-400 to-orange-600">
          <div className="absolute w-40 h-40 bg-white rounded-full -right-10 -top-10 opacity-10"></div>
          <div className="absolute bottom-0 w-32 h-32 bg-white rounded-full -left-10 opacity-10"></div>

          <div className="relative z-10">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">{appointment.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center rounded-full bg-white bg-opacity-20 px-3 py-1 text-sm font-medium backdrop-blur-sm`}
              >
                {appointmentStatus === "PENDING"
                  ? "대기중"
                  : appointmentStatus === "CONFIRMED"
                  ? "확정됨"
                  : appointmentStatus === "CANCELLED"
                  ? "취소됨"
                  : "완료됨"}
              </span>

              <span className="text-sm">
                {formatDate(appointment.date)}, {formatTime(appointment.startTime)} -{" "}
                {formatTime(appointment.endTime)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOrganizer && (
                <div className="flex flex-wrap gap-2">
                  <ModButton onClick={handleEditAppointment} isLoading={false} variant="light">
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      수정하기
                    </span>
                  </ModButton>

                  {appointmentStatus !== "CANCELLED" && (
                    <ModButton
                      onClick={handleCancelAppointment}
                      isLoading={cancelLoading}
                      variant="outline"
                    >
                      <span className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        취소하기
                      </span>
                    </ModButton>
                  )}

                  <ModButton
                    onClick={handleDeleteAppointment}
                    isLoading={deleteLoading}
                    variant="danger"
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      삭제하기
                    </span>
                  </ModButton>
                </div>
              )}

              {!isOrganizer && appointmentStatus === "PENDING" && (
                <>
                  <ModButton
                    onClick={() => handleStatusChange("confirmed")}
                    isLoading={updateLoading && status === "confirmed"}
                  >
                    수락
                  </ModButton>
                  <ModButton
                    onClick={() => handleStatusChange("declined")}
                    isLoading={updateLoading && status === "declined"}
                    variant="outline"
                  >
                    거절
                  </ModButton>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center space-y-6">
            {appointment.description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-5 bg-white border-2 border-gray-200 shadow-sm rounded-xl"
              >
                <h2 className="mb-3 text-lg font-medium text-gray-800">약속 설명</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{appointment.description}</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full p-5 bg-white border-2 border-gray-200 shadow-sm rounded-xl"
            >
              <div className="flex items-center mb-4">
                <svg
                  className="w-5 h-5 mr-2 text-orange-500"
                  xmlns="http://www.w3.org/2000/svg"
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
                <h2 className="text-lg font-medium text-gray-800">약속 장소</h2>
              </div>
              {appointment.locationTmap && (
                <>
                  <div className="p-1 mb-4 border-2 border-gray-200">
                    <p className="font-medium text-gray-900">
                      {appointment.locationTmap.locationName}
                    </p>
                    <p className="text-sm text-gray-600 ">
                      {appointment.locationTmap.fullAddress || "주소 정보 없음"}
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
              className="w-full p-5 bg-white border-2 border-gray-200 shadow-sm rounded-xl"
            >
              <div className="flex items-center mb-3">
                <svg
                  className="w-5 h-5 mr-2 text-orange-500"
                  xmlns="http://www.w3.org/2000/svg"
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
                <h2 className="text-lg font-medium text-gray-800">주최자</h2>2
              </div>
              <div className="flex items-center px-2 py-3 space-x-3 border-2 border-gray-200 ">
                {appointment.organizer.avatar ? (
                  <ImgComponent
                    imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${appointment.organizer.avatar}/public`}
                    width={48}
                    height={48}
                    clsProps="rounded-full border border-gray-200"
                    imgName={appointment.organizer.name}
                  />
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 text-orange-500 bg-orange-100 rounded-full">
                    <svg
                      className="w-6 h-6"
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
                  <p className="font-medium text-gray-900">{appointment.organizer.name}</p>
                  <p className="text-sm text-gray-500">{isOrganizer ? "나" : "주최자"}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full p-5 bg-white border-2 border-gray-200 shadow-sm rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-orange-500"
                    xmlns="http://www.w3.org/2000/svg"
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
                  <h2 className="text-lg font-medium text-gray-800">참가자</h2>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  {appointment.participants.length}명
                </span>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                <ul className="border-2 border-gray-200 divide-y divide-gray-100 rounded-lg">
                  {appointment.participants.map((participant: any) => (
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
                          <div className="flex items-center justify-center w-10 h-10 text-gray-500 bg-gray-100 rounded-full">
                            <svg
                              className="w-5 h-5"
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
                          {participant.user.id === user?.id && (
                            <p className="text-xs text-gray-500">나</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
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
            </motion.div>

            {appointment.notifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full p-5 bg-white border-2 border-gray-200 shadow-sm rounded-xl"
              >
                <div className="flex items-center mb-3">
                  <svg
                    className="w-5 h-5 mr-2 text-orange-500"
                    xmlns="http://www.w3.org/2000/svg"
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
                  <h2 className="text-lg font-medium text-gray-800">알림 설정</h2>
                </div>

                <ul className="space-y-3">
                  {appointment.notifications.map((notification: any) => (
                    <li
                      key={notification.id}
                      className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg shadow-sm bg-gray-50"
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
                        {notification.isSent ? (
                          <svg
                            className="w-4 h-4 text-green-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-.53 14.03a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V8.25a.75.75 0 00-1.5 0v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
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
