import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";
import aclient from "apiLibs/aclient";

interface VersionInfo {
  ok: boolean;
  version: string | null;
  forceUpdate?: boolean;
  message?: string;
}

// 강제 업데이트 차단에서 제외할 경로 (로그인, 관리자 페이지)
const BYPASS_PATHS = ["/enter", "/admin"];

interface ForceUpdateGuardProps {
  children: React.ReactNode;
}

export default function ForceUpdateGuard({ children }: ForceUpdateGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data } = useQuery<VersionInfo>({
    queryKey: ["app-version"],
    queryFn: async () => {
      const res = await aclient.get<VersionInfo>("/api/app/version");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const isBypassed = BYPASS_PATHS.some((path) =>
    router.pathname.startsWith(path)
  );

  // DB에서 최신 버전을 다시 조회합니다.
  // 재조회 후 localStorage에 버전을 저장해 NewVersionBanner와 상태를 공유합니다.
  const handleUpdate = async () => {
    setIsUpdating(true);
    // localStorage 먼저 저장 → 이후 invalidateQueries로 리렌더 유발
    if (data?.version) {
      localStorage.setItem("app_seen_version", data.version);
    }
    await queryClient.invalidateQueries({ queryKey: ["app-version"] });
    setIsUpdating(false);
  };

  // localStorage에 이미 현재 버전을 확인했다면 차단하지 않음
  const seenVersion = typeof window !== "undefined"
    ? localStorage.getItem("app_seen_version")
    : null;
  const alreadySeen = data?.version != null && seenVersion === data.version;

  if (!isBypassed && data?.forceUpdate && !alreadySeen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-6 text-6xl">🚨</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">업데이트가 필요합니다</h1>
        <p className="mb-1 text-base text-gray-600">
          새로운 버전이 출시되었습니다. 업데이트 후 이용해 주세요.
        </p>
        {data.message && (
          <p className="px-4 py-2 mb-4 text-sm text-gray-700 bg-gray-100 rounded-lg">
            {data.message}
          </p>
        )}
        {data.version && (
          <p className="mb-6 text-xs text-gray-400">최신 버전: v{data.version}</p>
        )}
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="px-8 py-3 text-base font-semibold text-white transition-all bg-orange-500 shadow rounded-xl hover:bg-orange-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUpdating ? "업데이트 중..." : "지금 업데이트"}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
