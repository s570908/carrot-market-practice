import type { NextPage } from "next";
import Layout from "@components/Layout";
import ProductList from "@components/ProductList";
import { Kind } from "@prisma/client";

const Loved: NextPage = () => {
  return (
    <Layout
      seoTitle="나의 관심목록"
      title="나의 관심목록"
      canGoBack
      backUrl={"/profile"}
      isProfile={true}
    >
      <ProductList kind={Kind.Fav} />
    </Layout>
  );
};

export default Loved;
