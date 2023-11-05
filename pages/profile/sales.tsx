import type { NextPage } from "next";
import Layout from "@components/Layout";
import ProductList from "@components/ProductList";

const Sold: NextPage = () => {
  return (
    <Layout
      seoTitle="나의 판매내역"
      title="나의 판매내역"
      canGoBack
      backUrl={"/profile"}
      isProfile={true}
    >
      <ProductList kind="sales" />
    </Layout>
  );
};

export default Sold;
