import type { NextPage } from "next";
import Layout from "@components/Layout";
import ProductList from "@components/ProductList";

const Loved: NextPage = () => {
  return (
    <Layout
      seoTitle="나의 관심목록"
      title="나의 관심목록"
      canGoBack
      backUrl={"/profile"}
      isProfile={true}
    >
      <ProductList kind="favs" />
    </Layout>
  );
};

export default Loved;
