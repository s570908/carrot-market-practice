import Layout from "@components/Layout";
import ProductList from "@components/Product-list";
import type { NextPage } from "next";

const Loved: NextPage = () => {
  return (
    <Layout seoTitle="관심목록" title="관심목록" canGoBack backUrl={"/profile"} isProfile={true}>
      <ProductList kind="favs" />
    </Layout>
  );
};

export default Loved;
