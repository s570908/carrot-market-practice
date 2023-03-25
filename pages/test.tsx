import Layout from "@components/Layout";
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <Layout title="Test Page" canGoBack={true} hasTabBar seoTitle="Test for Carrot Market">
      <div>여기는 테스트 페이지입니다.</div>
    </Layout>
  );
};

export default Home;
