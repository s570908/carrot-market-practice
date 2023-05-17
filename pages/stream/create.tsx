import type { NextPage } from "next";
import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import useUser from "@libs/client/useUser";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import useMutation from "@libs/client/useMutation";
import { useEffect } from "react";
import { Stream } from "@prisma/client";

interface CreateForm {
  name: string;
  price: number;
  description: string;
}

interface CreateResponse {
  ok: boolean;
  stream: Stream;
}

const Create: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { register, handleSubmit } = useForm<CreateForm>();
  const [createStream, { loading, data }] = useMutation<CreateResponse>(`/api/streams`);
  const onValid = (form: CreateForm) => {
    if (loading) return;
    createStream(form);
  };
  useEffect(() => {
    if (data && data.ok) {
      router.push(`/stream/${data.stream.id}`);
    }
  }, [data, router]);
  return (
    <Layout seoTitle="Go Live" canGoBack title="Go Live" backUrl={"/stream"}>
      <form onSubmit={handleSubmit(onValid)} className="space-y-4 px-4 py-10 ">
        <Input
          register={register("name", { required: true })}
          label="Name"
          name="name"
          type="text"
        />
        <Input
          register={register("price", { required: true, valueAsNumber: true })}
          label="Price"
          placeholder="0"
          name="price"
          type="text"
          kind="price"
        />
        <TextArea
          register={register("description", { required: true })}
          name="description"
          label="Description"
        />
        <Button text={loading ? "Loading..." : "Go live"} />
      </form>
    </Layout>
  );
};

export default Create;
