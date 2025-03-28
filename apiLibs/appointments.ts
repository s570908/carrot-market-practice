import aclient from "./aclient";

// 약속 정보 응답 타입
export interface AppointmentResponse {
  ok: boolean;
  appointment: {
    id: number;
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    locationName: string;
    locationAddress: string;
    roadAddress?: string;
    latitude: number;
    longitude: number;
    zoomLevel: number;
    status: string;
    organizer: {
      id: number;
      name: string;
      avatar?: string;
    }; // 주최자 정보 추가
    participants: Array<{
      user: {
        id: number;
        name: string;
        avatar?: string;
      };
      status: string;
    }>;
    notifications: Array<{
      id: number;
      title: string;
      minutesBefore: number;
      type: string;
      message?: string;
    }>;
  };
  userRole?: "organizer" | "participant";
}

// 친구 목록 응답 타입
export interface FriendsResponse {
  ok: boolean;
  friends: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
}

/**
 * 특정 ID의 약속 정보를 가져옵니다.
 * @param id 약속 ID
 * @returns 약속 정보 응답 데이터
 */
export async function getAppointment(id: number) {
  const response = await aclient.get<AppointmentResponse>(`/api/appointments/${id}`);
  return response.data;
}

/**
 * 약속을 수정합니다.
 * @param id 약속 ID
 * @param appointmentData 수정할 약속 데이터
 * @returns 수정된 약속 정보 응답 데이터
 */
export async function updateAppointment(id: number, appointmentData: any) {
  const response = await aclient.put<AppointmentResponse>(
    `/api/appointments/${id}`,
    appointmentData
  );
  return response.data;
}

/**
 * 약속 참가자의 상태를 변경합니다.
 * @param id 약속 ID
 * @param status 변경할 상태 ('confirmed' | 'declined')
 * @returns 상태 변경 응답 데이터
 */
export async function updateAppointmentStatus(id: number, status: string) {
  const response = await aclient.put<{ ok: boolean }>(`/api/appointments/${id}/participants`, {
    status,
  });
  return response.data;
}

/**
 * 약속을 취소합니다.
 * @param id 약속 ID
 * @param status 변경할 상태 (보통 'CANCELLED')
 * @returns 약속 취소 응답 데이터
 */
export async function cancelAppointment(id: number, status: string) {
  const response = await aclient.put<{ ok: boolean }>(`/api/appointments/${id}`, {
    status,
  });
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
