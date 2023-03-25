import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import type { NextPage } from "next";

const Create: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="space-y-5 px-4 py-2 ">
        <Input name="name" label="Name" required />
        <Input name="price" label="Price" required />
        <TextArea name="description" label="Description" />
        <Button text="Go live" />
      </div>
    </Layout>
  );
};

export default Create;
