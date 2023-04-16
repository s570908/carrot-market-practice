import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import useMutation from "@libs/client/useMutation";
import { Product } from "@prisma/client";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface UploadProductForm {
  name: string;
  price: number;
  description: string;
}

interface UploadProductMutation {
  ok: boolean;
  product: Product;
}

const Upload: NextPage = () => {
  const [uploadProduct, { data, loading, error }] =
    useMutation<UploadProductMutation>("/api/products");
  const { handleSubmit, register } = useForm<UploadProductForm>();
  const router = useRouter();

  const onValid = (uploadForm: UploadProductForm) => {
    console.log("Upload--onValid: {name, price, description}: ", uploadForm);
    // 여러번 요청이 가는 것을 막기 위함.
    if (loading) return;
    uploadProduct(uploadForm);
  };
  const onInValid = (error: any) => {
    console.log("Upload--onInValid: error: ", error);
  };

  useEffect(() => {
    if (data?.ok) {
      router.push(`/products/${data?.product.id}`);
    }
  }, [data, router]);

  return (
    <Layout canGoBack>
      <form onSubmit={handleSubmit(onValid, onInValid)} className="space-y-5 px-4 py-3">
        <div>
          <label className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 py-6 text-gray-600 hover:border-orange-500 hover:text-orange-500">
            <svg
              className="h-12 w-12"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input className="hidden" type="file" />
          </label>
        </div>
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
        <Button text={loading ? "Loading" : "Upload product"} />
      </form>
    </Layout>
  );
};

export default Upload;
