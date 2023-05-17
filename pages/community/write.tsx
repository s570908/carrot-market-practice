import type { NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import useMutation from "@libs/client/useMutation";
import { useEffect } from "react";
import { Post } from "@prisma/client";
import { useRouter } from "next/router";
import useCoords from "@libs/client/useCoords";

interface WriteForm {
  question: string;
}

interface WriteResponse {
  ok: boolean;
  post: Post;
}

const Write: NextPage = () => {
  const { latitude, longitude } = useCoords();
  const router = useRouter();
  const { register, handleSubmit } = useForm<WriteForm>({ mode: "onChange" });
  const [post, { loading, data }] = useMutation<WriteResponse>("/api/posts");
  const onValid = (writeForm: WriteForm) => {
    if (loading) return;
    post({ ...writeForm, latitude, longitude });
  };
  useEffect(() => {
    if (data && data.ok) {
      router.push(`/community/${data.post.id}`);
    }
  }, [data, router]);
  return (
    <Layout seoTitle="포스팅" canGoBack title="포스팅" backUrl={"/community"}>
      <form className="px-4 py-10" onSubmit={handleSubmit(onValid)}>
        <TextArea
          register={register("question", { required: true, minLength: 5 })}
          placeholder="Ask a question!"
        />
        <Button text={loading ? "loading..." : "Submit"} />
      </form>
    </Layout>
  );
};

export default Write;
