import Layout from "@components/Layout";
import { useRouter } from "next/router";
import { logout } from "@/apiLibs/users";

export default function Settings() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await logout();
      if (response.status === 200) {
        router.push("/enter");
      } else {
        alert("로그아웃에 실패했습니다.");
      }
    } catch (error) {
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <Layout seoTitle="설정" title="설정" canGoBack>
      <div className="p-6">
        <h2 className="mb-6 text-lg font-bold">설정</h2>
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-orange-500 py-3 font-medium text-white hover:bg-orange-600"
        >
          로그아웃
        </button>
      </div>
    </Layout>
  );
}
