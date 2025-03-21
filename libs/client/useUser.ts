import { useRouter } from "next/router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@prisma/client";
import { getMe } from "@/apiLibs/users";
import { MeResponse } from "@/apiLibs/atypes";

// MeResponse 인터페이스 정의 (getMe()가 반환하는 데이터 구조)
// interface MeResponse {
//   ok: boolean;
//   user: User;
// }

const useUser = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => getMe(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  //console.log("useUser: data: ", data);

  // 타입 안전한 mutate 함수 구현
  const mutate = (newData?: MeResponse) => {
    if (newData) {
      // 새 데이터로 캐시 직접 업데이트
      queryClient.setQueryData(["user", "me"], newData);
    } else {
      // 캐시 무효화하고 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    }
  };

  const router = useRouter();
  useEffect(() => {
    if (data && !data.ok) {
      router.replace("/enter");
    }
  }, [data, router]);

  return {
    user: data?.profile,
    isLoading: isLoading,
    error: isError,
    mutate,
  };
};

export default useUser;
