import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import type { NextPage } from "next";
import { FieldErrors, useForm } from "react-hook-form";

interface CreateForm {
  name: string;
  price: number;
  description: string;
}

const Create: NextPage = () => {
  const { handleSubmit, register } = useForm<CreateForm>();
  const onValid = ({ name, price, description }: CreateForm) => {
    console.log("Upload--onValid: name, price, description: ", name, price, description);
  };
  const onInValid = (errors: FieldErrors) => {
    console.log("Upload--onInValid: error: ", errors);
  };
  return (
    <Layout canGoBack title="Go Live">
      <form onSubmit={handleSubmit(onValid, onInValid)} className="space-y-5 px-4 py-3">
        <Input
          register={register("name", { required: true })}
          type="string"
          label="Name"
          name="name"
        />
        <Input
          register={register("price", { required: true })}
          type="number"
          label="Price"
          name="price"
          kind="price"
        />
        <TextArea
          register={register("description", { required: true })}
          label="Description"
          name="description"
        />
        <Button text="Go live" />
      </form>
    </Layout>
  );
};

export default Create;
