import type { NextPage } from "next";
import Layout from "@components/Layout";
import ProductList from "@components/ProductList";

const Bought: NextPage = () => {
  return (
    <Layout
      seoTitle="나의 구매내역"
      title="나의 구매내역"
      canGoBack
      backUrl={"/profile"}
      isProfile={true}
    >
      <ProductList kind="purchases" />
    </Layout>
  );
};

export default Bought;
