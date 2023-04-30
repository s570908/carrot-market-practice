import Item from "@components/Item";
import Layout from "@components/Layout";
import type { NextPage } from "next";

const Sold: NextPage = () => (
  <Layout canGoBack title="판매내역">
    <div className="p flex flex-col space-y-5 py-3">
      {[...Array(10)].map((_, i) => (
        <Item key={i} title="New iPhone 14" price={95} hearts={1} comments={1} id={i} />
      ))}
    </div>
  </Layout>
);

export default Sold;
