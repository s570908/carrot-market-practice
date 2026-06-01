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

export default function NewVersionBanner() {
  const [dismissed, setDismissed] = useState(false);

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
  const isNew = seen !== data.version;

  // forceUpdate=true 는 ForceUpdateGuard가 처리하므로 배너에서 제외
  if (!isNew || dismissed || data.forceUpdate) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, data.version!);
    setDismissed(true);
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
