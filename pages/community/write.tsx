import Button from "@components/Button";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import useMutation from "@libs/client/useMutation";
import { Post } from "@prisma/client";
import type { NextPage } from "next";
import router from "next/router";
import { useEffect } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { isErrored } from "stream";

interface WriteForm {
  question: string;
}

interface WriteMutation {
  ok: boolean;
  post: Post;
}

const Write: NextPage = () => {
  const { handleSubmit, register } = useForm<WriteForm>();
  const [post, { data, loading, error }] = useMutation<WriteMutation>("/api/posts");
  const onValid = (data: WriteForm) => {
    if (loading) return;
    console.log("Write onValid, data: ", data);
    post(data);
  }; //  http post
  const onInValid = (errors: FieldErrors) => {
    console.log("Errors: ", errors);
  };
  useEffect(() => {
    if (data?.ok) {
      router.push(`/community/${data.post.id}`);
    }
  });
  return (
    <Layout canGoBack>
      <form onSubmit={handleSubmit(onValid, onInValid)} className="px-4 py-10">
        <div className="px-4">
          <TextArea
            register={register("question", { required: true, minLength: 5 })}
            placeholder="Ask a question!"
          />
          <Button text="submit" />
        </div>
      </form>
    </Layout>
  );
};

export default Write;
