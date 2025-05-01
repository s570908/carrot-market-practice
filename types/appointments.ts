import { TmapAddressInfo } from "./tmap";
import { AppointmentStatus, ParticipantStatus } from "@prisma/client";

// 기본 위치 인터페이스
export interface BaseLocation {
  // baseLocation 속성
  locationName: string;
  selectedAddress: string | null; // 장소 검색으로 얻은 주소 정보
  latitude: number;
  longitude: number;
  zoomLevel?: number;
}

// 지오정보 및 역 지오정보
export interface Location extends BaseLocation {
  // locationName: string; // 사용자 표시용 장소명 (buildingName과 동일)
  // selectedAddress: string | null; // 장소검색으로 얻은 주소정보
  // latitude: number;
  // longitude: number;
  // zoomLevel?: number;
  //
  addressInfo: TmapAddressInfo | null; // reverse geolocation 정보: 장소검색으로 얻은 주소정보로 혹은 맵클릭으로 얻은, 위도와 경도로서 역으로 얻은 주소정보.
}

// Tmap 기반 위치 정보 인터페이스
export interface LocationTmap extends Location {
  // id: number;
  // createdAt?: string;
  // updatedAt?: string;
  // 약속과의 관계 설정
  appointmentId?: number;
}

// 참가자 상태 변경 이벤트 데이터를 위한 타입 정의 추가
export interface ParticipantStatusChangeEvent {
  appointmentId: number;
  participantId: number;
  participantName: string;
  newStatus: ParticipantStatus; // 정확한 타입으로 제한
  timestamp: string;
}

// 약속 위치 수정 인터페이스
export interface AppointmentLocationUpdate extends Location {
  id?: number;
  //ddressInfo: TmapAddressInfo | null; // reverse geolocation 정보. 위도와 경도로서 얻은 주소정보.
}

export interface Notification {
  title: string;
  minutesBefore: number;
  type: string;
}

// CreateForm 인터페이스 수정
export interface CreateAppointmentForm {
  title: string;
  description: string;
  // date 필드 제거
  startTime?: Date | string; // string 타입도 허용
  endTime?: Date | string; // string 타입도 허용
}

// 약속 생성 요청 데이터 인터페이스 수정
export interface AppointmentCreateRequest extends CreateAppointmentForm {
  // title: string;
  // description: string;
  // date 필드 제거
  // startTime: Date | string; // string 타입도 허용
  // endTime: Date | string; // string 타입도 허용
  location: Location; // Location 인터페이스 활용
  participants: number[]; // 참가자 ID 배열
  notifications: Notification[]; // Notification 인터페이스 배열 활용
}

// 약속 수정 요청 인터페이스
export interface AppointmentUpdateRequest extends Partial<AppointmentCreateRequest> {
  // title?: string;
  // description?: string;
  // date?: Date | string;
  // startTime?: Date | string;
  // endTime?: Date | string;
  // location?: AppointmentLocationUpdate; // 수정된 위치 정보 인터페이스 사용
  // participantIds?: number[]; // 참가자 ID 목록
  status?: AppointmentStatus;
}

// 약속 수정 요청 데이터 인터페이스 (모든 필드가 optional)
//export interface AppointmentUpdateRequest extends Partial<AppointmentCreateRequest> {}

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

// API 응답용 약속 객체 인터페이스 수정
export interface AppointmentWithRelations {
  id: number;
  title: string;
  description?: string;
  // date 필드 제거
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

// export enum ParticipantStatus {
//   PENDING = "PENDING",
//   ACCEPTED = "ACCEPTED",
//   DECLINED = "DECLINED",
// }

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

// 약속 상세 조회 API 응답 타입
export interface AppointmentDetailApiResponse {
  ok: boolean;
  appointment: {
    id: number;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    status: string;
    organizerId: number;
    createdAt: string;
    updatedAt: string;
    organizer: UserBasic;
    participants: AppointmentParticipant[];
    locationTmap?: {
      id: number;
      appointmentId?: number | null;
      // 약속과의 관계 설정. BaseLocation
      locationName: string;
      selectedAddress: string;
      latitude: number;
      longitude: number;
      zoomLevel?: number;
      // ... 기타 LocationTmap 필드 ...
      addressInfo?: TmapAddressInfo; // 실제 타입이 있다면 명확히 지정
      createdAt?: string;
      updatedAt?: string;
    } | null;
    notifications: {
      id: number;
      appointmentId: number;
      title: string;
      message?: string | null;
      type: string;
      minutesBefore: number;
      isSent: boolean;
      sentAt?: string | null;
      createdAt: string;
      updatedAt: string;
    }[];
  };
  userRole: "organizer" | "participant";
}

// 친구 응답 인터페이스
export interface FriendsResponse extends ApiResponse {
  friends?: UserBasic[];
}

// 전체 약속 목록 응답으로 통일 (모든 타입에 대해 동일한 구조 사용)
export interface AppointmentListResponse<T extends "organized" | "participating" | "all" = "all">
  extends ApiResponse {
  organized: AppointmentWithRelations[];
  participating: AppointmentWithRelations[];
}

// 약속 상태별 색상 정의
export const statusColors: Record<AppointmentStatus, string> = {
  PENDING: "#FFA000", // 황색
  CONFIRMED: "#4CAF50", // 녹색
  CANCELLED: "#F44336", // 적색
  COMPLETED: "#9E9E9E", // 회색
};

// 약속 상태별 텍스트
export const statusText = {
  PENDING: "대기중",
  CONFIRMED: "확정됨",
  CANCELLED: "취소됨",
  COMPLETED: "완료됨",
};

// FullCalendar 이벤트 타입 정의
export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  textColor: string;
  allDay: boolean;
}

// Prisma에서 가져온 약속 데이터 타입 정의
export interface AppointmentForCalendarEvent {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
}
