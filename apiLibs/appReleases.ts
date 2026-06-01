import aclient from "./aclient";

export interface AppRelease {
  id: number;
  version: string;
  buildId: string;
  releasedAt: string;
  createdAt: string;
  updatedAt: string;
  forceUpdate: boolean;
  message?: string;
}

// 모든 버전 조회
export async function getAllReleases() {
  const response = await aclient.get<{ ok: boolean; data: AppRelease[] }>("/api/admin/app-releases");
  return response.data;
}

// 새 버전 생성
export async function createRelease(data: {
  version: string;
  buildId: string;
  forceUpdate?: boolean;
  message?: string;
}) {
  const response = await aclient.post<{ ok: boolean; data: AppRelease }>(
    "/api/admin/app-releases",
    data
  );
  return response.data;
}

// 버전 수정
export async function updateRelease(
  id: number,
  data: {
    version?: string;
    buildId?: string;
    forceUpdate?: boolean;
    message?: string;
  }
) {
  const response = await aclient.patch<{ ok: boolean; data: AppRelease }>(
    "/api/admin/app-releases",
    { id, ...data }
  );
  return response.data;
}

// 버전 삭제
export async function deleteRelease(id: number) {
  const response = await aclient.delete<{ ok: boolean }>(
    "/api/admin/app-releases",
    { data: { id } }
  );
  return response.data;
}
