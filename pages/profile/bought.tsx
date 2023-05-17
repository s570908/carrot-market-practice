import type { NextPage } from "next";
import Layout from "@components/Layout";
import ProductList from "@components/Product-list";

const Bought: NextPage = () => {
  return (
    <Layout seoTitle="구매내역" title="구매내역" canGoBack backUrl={"/profile"} isProfile={true}>
      <ProductList kind="purchases" />
    </Layout>
  );
};

export default Bought;
