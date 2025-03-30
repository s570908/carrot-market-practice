import type { NextPage } from "next";
import Button from "@components/Button";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useRouter } from "next/router";
import useCoords from "@libs/client/useCoords";
import { useMutation } from "@tanstack/react-query";
import { WriteForm } from "@/types";
import { writePost } from "@/apiLibs/posts";

const Write: NextPage = () => {
  const { latitude, longitude } = useCoords();
  const router = useRouter();
  const { register, handleSubmit } = useForm<WriteForm>({ mode: "onChange" });

  const {
    mutate: post,
    data,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: (validForm: WriteForm) => writePost(validForm),
  });

  const onValid = (writeForm: WriteForm) => {
    if (loading) return;
    const validForm = {
      ...writeForm,
      ...(latitude !== null && { latitude }),
      ...(longitude !== null && { longitude }),
    };
    post(validForm);
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
