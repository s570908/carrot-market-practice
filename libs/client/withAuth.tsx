import { useRouter } from "next/router";
import { useEffect, ComponentType } from "react";
import useUser from "@libs/client/useUser";
import LoadingScreen from "@components/LoadingScreen";


export function withAuth<P extends object>(Component: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { user, isLoading } = useUser();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push("/enter");
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (!user) {
      return null; // 또는 로딩 스피너
    }

    return <Component {...props} user={user} />;
  };
}

// 공개 페이지용 HOC
export function withPublic<P extends object>(Component: ComponentType<P>) {
  return function PublicComponent(props: P) {
    const { user } = useUser(); // 리다이렉트 없음
    return <Component {...props} user={user} />;
  };
}
