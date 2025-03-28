import aclient from "./aclient";

// 친구 목록 응답 타입
export interface FriendsResponse {
  ok: boolean;
  friends: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
}

// 사용자 검색 응답 타입
export interface UsersResponse {
  ok: boolean;
  users: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
  nextPage?: number;
  totalPages: number;
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
 * 친구를 추가합니다.
 * @param name 추가할 친구 이름
 * @returns 추가된 친구 응답 데이터
 */
export async function addFriend(name: string) {
  const response = await aclient.post<{ ok: boolean; friend: { id: number; name: string } }>(
    "/api/users/friends",
    { name }
  );
  return response.data;
}

/**
 * 친구를 제거합니다.
 * @param id 제거할 친구 ID
 * @returns 제거 결과 응답 데이터
 */
export async function removeFriend(id: number) {
  const response = await aclient.delete<{ ok: boolean }>(`/api/users/friends/${id}`);
  return response.data;
}

/**
 * 페이지네이션으로 사용자 목록을 가져옵니다.
 * @param page 페이지 번호
 * @param pageSize 페이지당 항목 수
 * @returns 사용자 목록 응답 데이터
 */
export async function searchUsers(page: number = 1, pageSize: number = 20) {
  const response = await aclient.get<UsersResponse>(`/api/users?page=${page}&pageSize=${pageSize}`);
  return response.data;
}
