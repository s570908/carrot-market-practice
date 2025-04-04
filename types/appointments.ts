import { TmapAddressInfo } from "./tmap";
import { AppointmentStatus } from "@prisma/client";

// CreateForm 인터페이스
export interface CreateAppointmentForm {
  title: string;
  description: string;
  date: Date | string; // string 타입도 허용
  startTime: Date | string; // string 타입도 허용
  endTime: Date | string; // string 타입도 허용
}

export interface Location {
  latitude: number;
  longitude: number;
  addressInfo: TmapAddressInfo | null;
}

export interface Notification {
  title: string;
  minutesBefore: number;
  type: string;
}

// 약속 생성 요청 데이터 인터페이스
export interface AppointmentCreateRequest extends CreateAppointmentForm {
  location: Location; // Location 인터페이스 활용
  participants: number[]; // 참가자 ID 배열
  notifications: Notification[]; // Notification 인터페이스 배열 활용
}

// 약속 수정 요청 데이터 인터페이스 (모든 필드가 optional)
export interface AppointmentUpdateRequest extends Partial<AppointmentCreateRequest> {}

// 기본 응답 인터페이스
export interface ApiResponse {
  ok: boolean;
  error?: string;
}

// 기본적인 사용자 정보 인터페이스 (재사용을 위함)
export interface UserBasic {
  id: number;
  name: string;
  avatar?: string;
}

// 약속 참가자 인터페이스
export interface AppointmentParticipant {
  id: number;
  userId: number;
  status: ParticipantStatus; // 문자열이 아닌 Enum으로 정의 필요
  user: UserBasic;
}

export interface AppointmentNotification {
  id: number;
  title: string;
  message?: string;
  type: NotificationType; // 문자열이 아닌 Enum으로 정의 필요
  minutesBefore: number;
}

// 기본 위치 인터페이스
interface BaseLocation {
  latitude: number;
  longitude: number;
}

// Tmap 기반 위치 정보 인터페이스
export interface LocationTmap extends BaseLocation, TmapAddressInfo {
  id: number;
  latitude: number;
  longitude: number;
  locationName: string;
  zoomLevel?: number;
  appointmentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 약속 위치 수정 인터페이스
export interface AppointmentLocationUpdate extends BaseLocation {
  id?: number;
  locationName?: string;
  addressInfo: TmapAddressInfo | null;
}

// API 응답용 확장 인터페이스 정의
export interface AppointmentWithRelations {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  organizerId: number;
  createdAt: string;
  updatedAt: string;

  // 관계 데이터
  organizer: UserBasic;
  participants: AppointmentParticipant[];
  notifications: AppointmentNotification[];
  locationTmap?: LocationTmap; // LocationTmap 인터페이스 사용
}

export enum ParticipantStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export enum NotificationType {
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

// 응답 인터페이스 수정
export interface AppointmentResponse extends ApiResponse {
  appointment?: AppointmentWithRelations;
  userRole?: "organizer" | "participant";
}

// 약속 수정 요청 인터페이스
export interface AppointmentUpdateRequest {
  title?: string;
  description?: string;
  date?: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: AppointmentStatus;
  location?: AppointmentLocationUpdate; // 수정된 위치 정보 인터페이스 사용
  participantIds?: number[]; // 참가자 ID 목록
}

// 친구 응답 인터페이스
export interface FriendsResponse extends ApiResponse {
  friends?: UserBasic[];
}

// 특정 타입의 약속 목록 응답 (organized, participating)
export interface AppointmentListTypeResponse extends ApiResponse {
  appointments: AppointmentWithRelations[];
}

// 전체 약속 목록 응답 (type=all 또는 미지정)
export interface AppointmentListAllResponse extends ApiResponse {
  appointments: {
    organized: AppointmentWithRelations[];
    participating: AppointmentWithRelations[];
  };
}

// 응답 타입 통합 (제네릭으로 타입 감지)
export type AppointmentListResponse<T extends string = "all"> = T extends
  | "organized"
  | "participating"
  ? AppointmentListTypeResponse
  : AppointmentListAllResponse;
