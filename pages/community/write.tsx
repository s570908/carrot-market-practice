import Button from "@components/Button";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import type { NextPage } from "next";

const Write: NextPage = () => {
  return (
    <Layout canGoBack>
      <form className="space-y-2 px-4">
        <div className="px-4">
          <TextArea placeholder="Ask a question!" required />
          <Button text="submit" />
        </div>
      </form>
    </Layout>
  );
};

export default Write;
