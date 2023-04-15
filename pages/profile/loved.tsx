import Item from "@components/Items1";
import type { NextPage } from "next";

const Loved: NextPage = () => (
  <div className="p flex flex-col space-y-5 py-10">
    {[...Array(10)].map((_, i) => (
      <Item key={i} title="New iPhone 14" price={95} id={i} comments={1} hearts={1} />
    ))}
  </div>
);

export default Loved;
