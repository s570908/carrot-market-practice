import { AppointmentStatus, ParticipantStatus } from "@prisma/client";

// 약속 생성 이벤트 타입
export interface AppointmentCreatedEvent {
  appointmentId: number;
  organizerId: number;
}

// 약속 목록 업데이트 이벤트 타입
export interface AppointmentListUpdateEvent {
  type: "created" | "updated" | "deleted";
  appointmentId: number;
  organizerId: number;
  timestamp: string;
}

// 약속 상태 변경 이벤트 타입
export interface AppointmentStatusChangeEvent {
  appointmentId: number;
  status: AppointmentStatus;
  updatedBy: number;
  timestamp: string;
}

// 참가자 응답 변경 이벤트 타입
export interface ParticipantResponseEvent {
  appointmentId: number;
  participantId: number;
  userId: number;
  userName: string;
  status: ParticipantStatus;
  timestamp: string;
}

// 알림 이벤트 타입
export interface NotificationEvent {
  recipientId: number;
  type: string;
  message: string;
  appointmentId?: number;
}
