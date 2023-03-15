import Button from "@components/Button";
import TextArea from "@components/textArea";
import type { NextPage } from "next";

const Write: NextPage = () => {
  return (
    <div className="px-4 py-10">
      <div className="px-4">
        <TextArea placeholder="Ask a question!" />
        <Button text="submit" />
      </div>
    </div>
  );
};

export default Write;
