import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import aclient from "apiLibs/aclient";

interface VersionInfo {
  ok: boolean;
  version: string | null;
  buildId?: string;
  forceUpdate?: boolean;
  message?: string;
}

const STORAGE_KEY = "app_seen_version";
const DISMISSED_AT_KEY = "app_seen_version_dismissed_at";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export default function NewVersionBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data } = useQuery<VersionInfo>({
    queryKey: ["app-version"],
    queryFn: async () => {
      const res = await aclient.get<VersionInfo>("/api/app/version");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data?.version) return null;

  // 렌더 시점에 localStorage를 직접 읽어 판단 — useEffect 타이밍 문제 없음
  const seen = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const dismissedAtRaw =
    typeof window !== "undefined" ? localStorage.getItem(DISMISSED_AT_KEY) : null;
  const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : null;
  const dismissalExpired =
    dismissedAt != null && Number.isFinite(dismissedAt) ? Date.now() - dismissedAt >= SIX_HOURS_MS : false;
  const isNew = seen !== data.version;

  // forceUpdate=true 는 ForceUpdateGuard가 처리하므로 배너에서 제외
  // 같은 버전이라도 닫은 지 6시간이 지나면 다시 보여준다.
  if ((seen === data.version && !dismissalExpired) || dismissed || data.forceUpdate) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, data.version!);
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      localStorage.setItem(STORAGE_KEY, data.version!);
      localStorage.removeItem(DISMISSED_AT_KEY);
      window.location.reload();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 text-white bg-orange-500 shadow-lg">
      <div className="flex items-center justify-between max-w-lg gap-3 mx-auto">
        <div className="flex-1 text-sm">
          <span className="mr-2 font-bold">🆕 새 버전 출시 v{data.version}</span>
          {data.message && <span>{data.message}</span>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-3 py-1 text-sm font-semibold text-orange-500 bg-white rounded hover:bg-orange-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? "업데이트 중..." : "업데이트"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm border border-white rounded hover:bg-orange-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
