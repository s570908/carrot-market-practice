import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/apiLibs/users";

export default function useUser() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트에서만 마운트 상태 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Enter 페이지에서는 useUser 실행하지 않음
  const isEnterPage = router.pathname === "/enter";

  const { data, error, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => getMe(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5분 캐시
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
    // 🔑 핵심: Enter 페이지와 SSR 중에는 비활성화
    enabled: isMounted && !isEnterPage,
  });

  // 클라이언트에서만 리다이렉트 실행
  useEffect(() => {
    if (isMounted && !isEnterPage && !isLoading && data && !data.ok) {
      console.log("[useUser] Redirecting to /enter - not authenticated");
      router.push("/enter");
    }
  }, [data, router, isMounted, isEnterPage, isLoading]);

  return {
    user: data?.profile,
    isLoading: !isMounted || isLoading || (!data && !error),
  };
}
