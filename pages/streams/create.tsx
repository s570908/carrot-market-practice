import Button from "@components/Button";
import Input from "@components/Input";
import TextArea from "@components/Textarea";
import type { NextPage } from "next";

const Create: NextPage = () => {
  return (
    <div className="space-y-5 px-4 py-10 ">
      <Input label="Name" name="name" />
      <Input label="Price" name="price" kind="price" />
      <TextArea name="description" label="Description" />
      <Button text="Go live" />
    </div>
  );
};

export default Create;
