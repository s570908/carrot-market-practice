import { AppointmentStatus } from "@prisma/client";
import aclient from "./aclient";
import {
  AppointmentDetailApiResponse,
  AppointmentListResponse,
  AppointmentResponse,
  AppointmentUpdateRequest,
  FriendsResponse,
  TmapAddressInfo,
} from "@/types";
import { AppointmentCreateRequest, CreateForm } from "@/types";

// 기존 API 함수들
export async function getAppointment(id: number) {
  const response = await aclient.get<AppointmentDetailApiResponse>(
    `/api/appointments/${id}`
  );
  return response.data;
}

export async function writeAppointment(appointment: AppointmentCreateRequest) {
  const response = await aclient.post<AppointmentResponse>(
    `/api/appointments`,
    appointment
  );
  return response.data;
}

/**
 * 약속을 수정합니다.
 * @param id 약속 ID
 * @param appointmentData 수정할 약속 데이터
 * @returns 수정된 약속 정보 응답 데이터
 */
export async function updateAppointment(
  id: number,
  appointmentData: AppointmentUpdateRequest
) {
  const response = await aclient.put<AppointmentResponse>(
    `/api/appointments/${id}`,
    appointmentData
  );
  return response.data;
}

/**
 * 약속 참가자의 상태를 변경합니다.
 * @param id 약속 ID
 * @param status 변경할 상태 ('CONFIRMED' | 'DECLINED')
 * @returns 상태 변경 응답 데이터
 */
export async function updateAppointmentStatus(id: number, status: string) {
  console.log("updateAppointmentStatus", id, status);
  const response = await aclient.put<{ ok: boolean }>(
    `/api/appointments/${id}/status`,
    {
      status,
    }
  );
  return response.data;
}

/**
 * 약속을 취소합니다.
 * @param id 약속 ID
 * @param status 변경할 상태 (보통 'CANCELLED')
 * @returns 약속 취소 응답 데이터
 */
export async function cancelAppointment(id: number, status: string) {
  const response = await aclient.put<{ ok: boolean }>(
    `/api/appointments/${id}`,
    {
      status,
    }
  );
  return response.data;
}

/**
 * 친구 목록을 가져옵니다.
 * @returns 친구 목록 응답 데이터
 */
export async function getFriends() {
  const response = await aclient.get<FriendsResponse>("/api/users/friends");
  return response.data;
}

/**
 * 약속 목록을 조회합니다.
 * @param type 조회할 약속 타입 ("organized", "participating", "all")
 * @returns 약속 목록 데이터
 */
// 만약 호출자가 getAppointments<"organized">()와 같이 호출한다면, T는 "organized"가 됨
// 이 경우 기본값 "all"은 T("organized")에 할당할 수 없음
// 따라서 T의 기본값을 "all"로 설정하고, 호출자가 원하는 타입을 명시적으로 지정할 수 있도록 함
// T는 "organized", "participating", "all" 중 하나여야 함
// T가 "all"인 경우, AppointmentListAllResponse 타입을 사용하고,
// T가 "organized" 또는 "participating"인 경우, AppointmentListTypeResponse 타입을 사용함

// Method 1: 기본값을 제네릭 타입으로 처리

// export async function getAppointments<T extends "organized" | "participating" | "all" = "all">(
//   type: T = "all" as T
// ) {
//   const response = await aclient.get<AppointmentListResponse<T>>(`/api/appointments?type=${type}`);
//   return response.data;
// }

// Method 2: 기본값을 함수 내부에서 처리

export async function getAppointments<
  T extends "organized" | "participating" | "all"
>(type?: T) {
  const finalType = type ?? "all"; // 기본값을 함수 내부에서 처리
  const response = await aclient.get<AppointmentListResponse<T>>(
    `/api/appointments?type=${finalType}`
  );
  return response.data;
}

/**
 * 특정 날짜에 시작하는 약속을 조회합니다.
 * @param date 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns 해당 날짜에 시작하는 약속 목록
 *
 * 참고: 이 함수는 startTime의 날짜 부분이 지정된 날짜와 일치하는 약속을 반환합니다.
 * 예: "2023-09-15" 입력 → 2023년 9월 15일에 시작하는 모든 약속 반환
 */
export async function getAppointmentsByDate(date: string) {
  try {
    // API는 내부적으로 startTime을 사용해 필터링합니다
    const response = await aclient.get<AppointmentListResponse<"all">>(
      `/api/appointments?date=${date}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching appointments by date:", error);
    throw error;
  }
}

/**
 * 채팅방의 최신 약속 정보를 조회합니다.
 * @param chatRoomId 채팅방 ID
 * @returns 최신 약속 정보
 */
export async function getLatestChatMeetup(chatRoomId: number) {
  const response = await aclient.get(`/api/chat/${chatRoomId}/latest-meetup`);
  return response.data;
}
