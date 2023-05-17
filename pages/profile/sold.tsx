import type { NextPage } from "next";
import Layout from "@components/Layout";
import ProductList from "@components/Product-list";

const Sold: NextPage = () => {
  return (
    <Layout seoTitle="판매내역" title="판매내역" canGoBack backUrl={"/profile"} isProfile={true}>
      <ProductList kind="sales" />
    </Layout>
  );
};

export default Sold;
