import Button from "@components/Button";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import type { NextPage } from "next";

const Write: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="px-4 py-10">
        <div className="px-4">
          <TextArea placeholder="Ask a question!" />
          <Button text="submit" />
        </div>
      </div>
    </Layout>
  );
};

export default Write;
