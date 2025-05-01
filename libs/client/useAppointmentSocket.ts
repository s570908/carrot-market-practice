import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { AppointmentStatus, ParticipantStatus } from "@prisma/client";

interface UseAppointmentSocketProps {
  appointmentId?: number;
  userId?: number;
  enabled?: boolean;
}

interface AppointmentStatusChangeData {
  appointmentId: number;
  status: AppointmentStatus;
  updatedBy: number;
  timestamp: string;
}

interface ParticipantResponseData {
  appointmentId: number;
  participantId: number;
  userId: number;
  userName: string;
  status: ParticipantStatus;
  timestamp: string;
}

interface NotificationData {
  recipientId: number;
  type: string;
  message: string;
  appointmentId?: number;
}

// 약속 관련 소켓 이벤트를 처리하는 커스텀 훅
export default function useAppointmentSocket({
  appointmentId,
  userId,
  enabled = true,
}: UseAppointmentSocketProps) {
  const [connected, setConnected] = useState(false);
  const [lastStatusChange, setLastStatusChange] = useState<AppointmentStatusChangeData | null>(
    null
  );
  const [lastParticipantResponse, setLastParticipantResponse] =
    useState<ParticipantResponseData | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const socketRef = useRef<Socket | null>(null);

  // 소켓 이벤트 발신 함수들
  const emitAppointmentStatusChange = useCallback(
    (status: AppointmentStatus, updatedBy: number) => {
      if (!socketRef.current || !appointmentId) return;

      const data = {
        appointmentId,
        status,
        updatedBy,
        timestamp: new Date().toISOString(),
      };

      socketRef.current.emit("appointmentStatusChanged", data);
    },
    [appointmentId, socketRef.current]
  );

  const emitParticipantResponse = useCallback(
    (participantId: number, userId: number, userName: string, status: ParticipantStatus) => {
      if (!socketRef.current || !appointmentId) return;

      const data = {
        appointmentId,
        participantId,
        userId,
        userName,
        status,
        timestamp: new Date().toISOString(),
      };

      socketRef.current.emit("participantResponseChanged", data);
    },
    [appointmentId, socketRef.current]
  );

  const sendNotification = useCallback(
    (recipientId: number, type: string, message: string) => {
      if (!socketRef.current) return;

      const data = {
        recipientId,
        type,
        message,
        appointmentId,
      };

      socketRef.current.emit("sendNotification", data);
    },
    [appointmentId, socketRef.current]
  );

  // 연결 설정
  useEffect(() => {
    if (!enabled) return;

    // 소켓 연결
    if (!socketRef.current) {
      socketRef.current = io("/appointments", {
        path: "/api/socket",
        transports: ["websocket"],
      });
    }

    const socket = socketRef.current;

    // 연결 이벤트 처리
    socket.on("connect", () => {
      console.log("Connected to appointment socket server");
      setConnected(true);

      // 약속 룸 참여
      if (appointmentId) {
        socket.emit("joinAppointment", appointmentId);
      }

      // 사용자 룸 참여
      if (userId) {
        socket.emit("joinUserRoom", userId);
      }
    });

    // 약속 상태 업데이트 이벤트 수신
    socket.on("appointmentStatusUpdated", (data: AppointmentStatusChangeData) => {
      console.log("Appointment status updated:", data);
      setLastStatusChange(data);
    });

    // 참가자 응답 이벤트 수신
    socket.on("participantResponseUpdated", (data: ParticipantResponseData) => {
      console.log("Participant response updated:", data);
      setLastParticipantResponse(data);
    });

    // 알림 이벤트 수신
    socket.on("notification", (data: NotificationData) => {
      console.log("Notification received:", data);
      setNotifications((prev) => [...prev, data]);
    });

    // 연결 해제 이벤트 처리
    socket.on("disconnect", () => {
      console.log("Disconnected from appointment socket server");
      setConnected(false);
    });

    // 연결 오류 처리
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnected(false);
    });

    return () => {
      // 룸에서 나가기
      if (appointmentId) {
        socket.emit("leaveAppointment", appointmentId);
      }

      // 이벤트 리스너 제거
      socket.off("connect");
      socket.off("disconnect");
      socket.off("appointmentStatusUpdated");
      socket.off("participantResponseUpdated");
      socket.off("notification");
      socket.off("connect_error");
    };
  }, [appointmentId, userId, enabled]);

  return {
    connected,
    lastStatusChange,
    lastParticipantResponse,
    notifications,
    clearNotifications: () => setNotifications([]),
    emitAppointmentStatusChange,
    emitParticipantResponse,
    sendNotification,
  };
}
