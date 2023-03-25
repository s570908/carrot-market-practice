import Item from "@components/Item";
import Layout from "@components/Layout";
import type { NextPage } from "next";

const Loved: NextPage = () => (
  <Layout canGoBack>
    <div className="p flex flex-col space-y-5 py-3">
      {[...Array(10)].map((_, i) => (
        <Item key={i} title="New iPhone 14" price={95} hearts={1} comments={1} id={i} />
      ))}
    </div>
  </Layout>
);

export default Loved;
